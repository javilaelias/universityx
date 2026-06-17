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
}));

// bcrypt with 12 rounds takes ~400ms per hash — mock for speed
vi.mock('../services/password.service', () => ({
  hashPassword:   vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { app } from '../app';
import { query } from '../db/postgres';
import { verifyPassword } from '../services/password.service';

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
      .send({ email: 'test@example.com', password: 'password123', fullName: 'Test User' });

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
      .send({ email: 'existing@example.com', password: 'password123', fullName: 'Test' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya está registrado/);
  });

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123', fullName: 'Test' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a password shorter than 8 chars', async () => {
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
      .send({ email: 'test@example.com', password: 'password123' });

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
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for an inactive account', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...validUser, is_active: false, password_hash: '$hashed$' }], rowCount: 1,
    } as any);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/desactivada/);
  });
});
