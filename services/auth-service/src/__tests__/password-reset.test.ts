import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

const h = vi.hoisted(() => ({ clientQuery: vi.fn() }));

vi.mock('../db/postgres', () => ({
  pool:            { query: vi.fn() },
  query:           vi.fn(),
  connectPostgres: vi.fn().mockResolvedValue(undefined),
  withTransaction: vi.fn((fn: (c: unknown) => unknown) => fn({ query: h.clientQuery })),
}));

vi.mock('../db/redis', () => ({
  connectRedis:         vi.fn().mockResolvedValue(undefined),
  getRedis:             vi.fn(),
  storeRefreshToken:    vi.fn().mockResolvedValue(undefined),
  validateRefreshToken: vi.fn().mockResolvedValue(true),
  revokeRefreshToken:   vi.fn().mockResolvedValue(undefined),
  revokeAllUserTokens:  vi.fn().mockResolvedValue(undefined),
  countResetRequest:    vi.fn().mockResolvedValue(1),
  clearLoginFailures:   vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/password.service', () => ({
  hashPassword:   vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { app } from '../app';
import { query } from '../db/postgres';
import { countResetRequest, revokeAllUserTokens, clearLoginFailures } from '../db/redis';
import { hashPassword } from '../services/password.service';
import { requestPasswordReset } from '../controllers/password-reset.controller';
import { sha256 } from '../services/reset-token.service';

const mockQuery  = vi.mocked(query);
const mockCount  = vi.mocked(countResetRequest);
const mockRevoke = vi.mocked(revokeAllUserTokens);
const mockHash   = vi.mocked(hashPassword);
const fetchMock  = vi.fn();

const user  = { id: '11111111-1111-1111-1111-111111111111', full_name: 'Ana', language: 'en' };
const token = 'A'.repeat(43);

beforeEach(() => {
  vi.clearAllMocks();
  mockCount.mockResolvedValue(1);
  fetchMock.mockResolvedValue({ ok: true, status: 202 });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

// ── POST /auth/forgot-password ────────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  it.each([
    ['existe',    [user]],
    ['no existe', []],
  ])('responde 202 genérico si el email %s', async (_c, rows) => {
    mockQuery.mockResolvedValue({ rows, rowCount: rows.length } as any);
    h.clientQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    const res = await request(app).post('/auth/forgot-password').send({ email: 'a@x.test' });
    expect(res.status).toBe(202);
    expect(res.body.message).toMatch(/Si el correo está registrado/);
  });

  it('400 si el email es inválido', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email: 'nope' });
    expect(res.status).toBe(400);
  });
});

describe('requestPasswordReset', () => {
  it('crea token (solo hash en BD) y envía el correo con el enlace', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [user], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    await requestPasswordReset('a@x.test', 'en');

    const insert = mockQuery.mock.calls[1];
    expect(insert[0]).toMatch(/INSERT INTO password_reset_tokens/);
    const tokenHash = (insert[1] as string[])[1];
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const sent = new URL(body.data.resetUrl).searchParams.get('token')!;

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:4003/notifications/trigger');
    expect(body.event).toBe('auth.password_reset');
    expect(body.data.resetUrl).toMatch(/^http:\/\/localhost:3000\/reset-password\?token=/);
    expect(sent).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toBe(sha256(sent));
    expect(body.locale).toBe('en'); // el idioma de la web prevalece sobre users.language
    // no invalida los enlaces previos (un tercero no puede anular el de la víctima)
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('sin locale en la petición usa users.language', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...user, language: 'en' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    await requestPasswordReset('a@x.test');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).locale).toBe('en');
  });

  it('usuario inexistente, inactivo o sin contraseña local → no crea token ni envía', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    await requestPasswordReset('sso@x.test');
    expect(mockQuery.mock.calls[0][0]).toMatch(/is_active = true AND uc.password_hash IS NOT NULL/);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('más de 3 solicitudes por hora para el email → no consulta ni envía', async () => {
    mockCount.mockResolvedValueOnce(4);
    await requestPasswordReset('a@x.test');
    expect(mockCount).toHaveBeenCalledWith(sha256('a@x.test'));
    expect(mockQuery).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falla si notification-service no acepta', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [user], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(requestPasswordReset('a@x.test')).rejects.toThrow(/500/);
  });
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────

describe('POST /auth/reset-password', () => {
  it('200: cambia la contraseña, invalida otros tokens y revoca sesiones', async () => {
    h.clientQuery
      .mockResolvedValueOnce({ rows: [{ user_id: user.id, email: 'ana@x.test' }], rowCount: 1 }) // token válido (FOR UPDATE)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })                     // UPDATE credentials
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });                    // consume todos

    const res = await request(app).post('/auth/reset-password').send({ token, password: 'nueva-clave-1' });

    expect(res.status).toBe(200);
    expect(h.clientQuery.mock.calls[0][0]).toMatch(/FOR UPDATE/);
    expect(h.clientQuery.mock.calls[0][1]).toEqual([sha256(token)]);
    expect(h.clientQuery.mock.calls[1][1]).toEqual([user.id, '$hashed$']);
    expect(h.clientQuery.mock.calls[2][0]).toMatch(/SET used_at = NOW\(\) WHERE user_id/);
    expect(mockRevoke).toHaveBeenCalledWith(user.id);
    expect(vi.mocked(clearLoginFailures)).toHaveBeenCalledWith(sha256('ana@x.test')); // levanta el bloqueo
  });

  it('400 si el token es inválido, vencido o ya usado', async () => {
    h.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await request(app).post('/auth/reset-password').send({ token, password: 'nueva-clave-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválido o venció/);
    expect(mockRevoke).not.toHaveBeenCalled();
    expect(mockHash).not.toHaveBeenCalled(); // sin bcrypt para tokens inválidos
  });

  it('dos resets simultáneos con el mismo token → uno 200 y otro 400', async () => {
    let consumed = false;
    h.clientQuery.mockImplementation(async (sql: string) => {
      if (/FOR UPDATE/.test(sql)) {
        if (consumed) return { rows: [], rowCount: 0 };
        consumed = true;
        return { rows: [{ user_id: user.id, email: 'ana@x.test' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });
    const send = () => request(app).post('/auth/reset-password').send({ token, password: 'nueva-clave-1' });
    const statuses = (await Promise.all([send(), send()])).map((r) => r.status).sort();
    expect(statuses).toEqual([200, 400]);
  });

  it('400 de política si la contraseña contiene el email, sin consumir el token', async () => {
    h.clientQuery.mockResolvedValueOnce({ rows: [{ user_id: user.id, email: 'ana.perez@x.test' }], rowCount: 1 });
    const res = await request(app).post('/auth/reset-password').send({ token, password: 'ana.perez-2026' });
    expect(res.status).toBe(400);
    expect(res.body.fields[0].field).toBe('password');
    expect(h.clientQuery).toHaveBeenCalledTimes(1); // ni UPDATE ni consumo
    expect(mockHash).not.toHaveBeenCalled();
  });

  it('un fallo de Redis al limpiar el bloqueo no convierte el reset hecho en 500', async () => {
    h.clientQuery
      .mockResolvedValueOnce({ rows: [{ user_id: user.id, email: 'ana@x.test' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    vi.mocked(clearLoginFailures).mockRejectedValueOnce(new Error('redis caído'));
    const res = await request(app).post('/auth/reset-password').send({ token, password: 'nueva-clave-1' });
    expect(res.status).toBe(200);
  });

  it('400 si la cuenta está inactiva o no tiene contraseña local', async () => {
    h.clientQuery
      .mockResolvedValueOnce({ rows: [{ user_id: user.id, email: 'ana@x.test' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const res = await request(app).post('/auth/reset-password').send({ token, password: 'nueva-clave-1' });
    expect(res.status).toBe(400);
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it.each([
    ['contraseña corta',  { token, password: 'corta' }],
    ['token mal formado', { token: 'abc', password: 'nueva-clave-1' }],
    ['contraseña sin número', { token, password: 'solo-letras-largas' }],
    ['contraseña común',  { token, password: 'Password123' }],
  ])('400 por %s', async (_c, body) => {
    const res = await request(app).post('/auth/reset-password').send(body);
    expect(res.status).toBe(400);
    expect(h.clientQuery).not.toHaveBeenCalled();
  });
});
