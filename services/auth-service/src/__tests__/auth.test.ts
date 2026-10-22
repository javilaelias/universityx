import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../db/postgres', () => ({
  pool:            { query: vi.fn() },
  query:           vi.fn(),
  connectPostgres: vi.fn().mockResolvedValue(undefined),
  withTransaction: vi.fn(),
}));

vi.mock('../db/redis', () => ({
  connectRedis:       vi.fn().mockResolvedValue(undefined),
  getRedis:           vi.fn(),
  storeRefreshToken:  vi.fn().mockResolvedValue(undefined),
  validateRefreshToken: vi.fn().mockResolvedValue(true),
  revokeRefreshToken:   vi.fn().mockResolvedValue(undefined),
  revokeAllUserTokens:  vi.fn().mockResolvedValue(undefined),
  countLoginAttempt:    vi.fn().mockResolvedValue(1),
  clearLoginFailures:   vi.fn().mockResolvedValue(undefined),
  LOGIN_MAX_ATTEMPTS:   5,
}));

// bcrypt with 12 rounds takes ~400ms per hash — mock for speed
vi.mock('../services/password.service', () => ({
  hashPassword:   vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { app } from '../app';
import { query } from '../db/postgres';
import { verifyPassword } from '../services/password.service';
import { countLoginAttempt, clearLoginFailures } from '../db/redis';
import { sha256 } from '../services/reset-token.service';

const mockQuery = vi.mocked(query);
const mockVerifyPassword = vi.mocked(verifyPassword);

const validUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'student',
  avatar_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'auth-service' });
  });
});

// ── POST /auth/register ───────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with tokens for a new user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)           // check existing
      .mockResolvedValueOnce({ rows: [validUser], rowCount: 1 } as any)  // INSERT user
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);          // INSERT credentials

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'clave-segura-9', fullName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('returns 409 when email already taken', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: validUser.id }], rowCount: 1 } as any);

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'existing@example.com', password: 'clave-segura-9', fullName: 'Test' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya está registrado/);
  });

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'clave-segura-9', fullName: 'Test' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a password shorter than 10 chars', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'short', fullName: 'Test' });

    expect(res.status).toBe(400);
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with tokens for valid credentials', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...validUser, password_hash: '$hashed$' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE last_login_at

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'clave-segura-9' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('returns 401 for wrong password', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...validUser, password_hash: '$hashed$' }], rowCount: 1,
    } as any);
    mockVerifyPassword.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Credenciales incorrectas/);
  });

  it('returns 401 for non-existent user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'clave-segura-9' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for an inactive account', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...validUser, is_active: false, password_hash: '$hashed$' }], rowCount: 1,
    } as any);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'clave-segura-9' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/desactivada/);
  });
});

// ── Política de contraseñas ──────────────────────────────────────────────────

describe('POST /auth/register — política de contraseñas', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['9 caracteres',         'abcdefg12'],
    ['sin número',           'solo-letras-largas'],
    ['sin letra',            '1234567890123'],
    ['común',                'Password123'],
    ['contiene el email',    'ana.perez-2026'],
    ['más de 128',           'a1'.repeat(65)],
  ])('400 si la contraseña es %s, sin tocar la BD', async (_c, password) => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'ana.perez@example.com', password, fullName: 'Ana' });
    expect(res.status).toBe(400);
    expect(res.body.fields[0].field).toBe('password');
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

// ── Bloqueo temporal por intentos ─────────────────────────────────────────────

describe('POST /auth/login — bloqueo temporal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('429 ACCOUNT_LOCKED pasado el máximo de intentos, sin consultar BD ni bcrypt', async () => {
    vi.mocked(countLoginAttempt).mockResolvedValueOnce(6);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'lo-que-sea' });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('ACCOUNT_LOCKED');
    expect(countLoginAttempt).toHaveBeenCalledWith(sha256('test@example.com'));
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('el fallo que alcanza el máximo responde 429, también con un email inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    vi.mocked(countLoginAttempt).mockResolvedValueOnce(5);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'x' });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('ACCOUNT_LOCKED');
    expect(countLoginAttempt).toHaveBeenCalledWith(sha256('nobody@example.com'));
  });

  it('un fallo bajo el máximo responde 401 y no limpia el contador', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...validUser, password_hash: '$hashed$' }], rowCount: 1 } as any);
    mockVerifyPassword.mockResolvedValueOnce(false);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'mala' });
    expect(res.status).toBe(401);
    expect(countLoginAttempt).toHaveBeenCalledTimes(1);
    expect(clearLoginFailures).not.toHaveBeenCalled();
  });

  it('un login correcto limpia el contador', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...validUser, password_hash: '$hashed$' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'clave-segura-9' });
    expect(res.status).toBe(200);
    expect(clearLoginFailures).toHaveBeenCalledWith(sha256('test@example.com'));
  });
});
