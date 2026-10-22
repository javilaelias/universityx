import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const clientQuery = vi.fn();

vi.mock('../db/postgres', () => ({
  pool:            { query: vi.fn() },
  query:           vi.fn(),
  connectPostgres: vi.fn().mockResolvedValue(undefined),
  withTransaction: vi.fn((fn: (c: unknown) => unknown) => fn({ query: clientQuery })),
}));

vi.mock('../db/redis', () => ({
  connectRedis:         vi.fn().mockResolvedValue(undefined),
  getRedis:             vi.fn(),
  storeRefreshToken:    vi.fn().mockResolvedValue(undefined),
  validateRefreshToken: vi.fn().mockResolvedValue(true),
  revokeRefreshToken:   vi.fn().mockResolvedValue(undefined),
  revokeAllUserTokens:  vi.fn().mockResolvedValue(undefined),
  countLoginAttempt:    vi.fn().mockResolvedValue(1),
  clearLoginFailures:   vi.fn().mockResolvedValue(undefined),
  LOGIN_MAX_ATTEMPTS:   5,
}));

vi.mock('../services/password.service', () => ({
  hashPassword:   vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { app } from '../app';
import { query } from '../db/postgres';
import { revokeAllUserTokens } from '../db/redis';
import { generateTokenPair } from '../services/jwt.service';
import type { UserRole } from '../types/auth.types';

const mockQuery = vi.mocked(query);

const ADMIN_ID  = '00000000-0000-0000-0000-00000000000a';
const TARGET_ID = '00000000-0000-0000-0000-00000000000b';

function bearer(role: UserRole, sub = ADMIN_ID) {
  return `Bearer ${generateTokenPair(sub, 'a@example.com', role).accessToken}`;
}

const targetRow = {
  id: TARGET_ID, email: 'b@example.com', full_name: 'B', role: 'student',
  is_active: true, last_login_at: null, created_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  clientQuery.mockReset();
});

describe('acceso a /auth/admin', () => {
  it('401 sin token', async () => {
    const res = await request(app).get('/auth/admin/users');
    expect(res.status).toBe(401);
  });

  it.each(['student', 'instructor', 'support'] as UserRole[])('403 con rol %s', async (role) => {
    const res = await request(app).get('/auth/admin/users').set('Authorization', bearer(role));
    expect(res.status).toBe(403);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('403 al intentar autoasignarse admin siendo instructor', async () => {
    const res = await request(app)
      .patch(`/auth/admin/users/${ADMIN_ID}`)
      .set('Authorization', bearer('instructor'))
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });
});

describe('GET /auth/admin/users', () => {
  it('lista paginada con búsqueda parametrizada', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [targetRow] } as any)
      .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);

    const res = await request(app)
      .get('/auth/admin/users?search=b%27%3B--&role=student&page=1')
      .set('Authorization', bearer('admin'));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(res.body.users[0]).not.toHaveProperty('password_hash');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).not.toContain("b';--");
    expect(params).toEqual(["%b';--%", 'student', 20, 0]);
  });

  it('busca % y _ literalmente', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);
    await request(app).get('/auth/admin/users?search=a_b%25').set('Authorization', bearer('admin'));
    expect(mockQuery.mock.calls[0][1]?.[0]).toBe('%a\\_b\\%%');
  });

  it('400 con rol inválido', async () => {
    const res = await request(app)
      .get('/auth/admin/users?role=root')
      .set('Authorization', bearer('admin'));
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/admin/users', () => {
  const body = { email: 'nuevo@example.com', fullName: 'Nuevo', role: 'instructor', password: 'clave-segura-9' };

  it('201 crea usuario con rol y credenciales', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    clientQuery
      .mockResolvedValueOnce({ rows: [{ ...targetRow, role: 'instructor' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/auth/admin/users').set('Authorization', bearer('admin')).send(body);

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('instructor');
    expect(clientQuery.mock.calls[0][1]).toEqual(['nuevo@example.com', 'Nuevo', 'instructor']);
    expect(clientQuery.mock.calls[1][1]).toEqual([TARGET_ID, '$hashed$']);
  });

  it('409 si otra alta del mismo email gana la carrera (23505)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    clientQuery.mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }));
    const res = await request(app).post('/auth/admin/users').set('Authorization', bearer('admin')).send(body);
    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).not.toContain('duplicate');
  });

  it('409 si el email existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: TARGET_ID }] } as any);
    const res = await request(app).post('/auth/admin/users').set('Authorization', bearer('admin')).send(body);
    expect(res.status).toBe(409);
  });

  it('400 si la contraseña no cumple la política', async () => {
    const res = await request(app)
      .post('/auth/admin/users')
      .set('Authorization', bearer('admin'))
      .send({ ...body, password: 'corta1' });
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('PATCH /auth/admin/users/:id', () => {
  it('cambia el rol y revoca las sesiones del usuario', async () => {
    clientQuery
      .mockResolvedValueOnce({ rows: [{ id: ADMIN_ID }] })
      .mockResolvedValueOnce({ rows: [{ ...targetRow, role: 'support' }] });

    const res = await request(app)
      .patch(`/auth/admin/users/${TARGET_ID}`)
      .set('Authorization', bearer('admin'))
      .send({ role: 'support' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('support');
    expect(revokeAllUserTokens).toHaveBeenCalledWith(TARGET_ID);
  });

  it('400 al modificarse a sí mismo', async () => {
    const res = await request(app)
      .patch(`/auth/admin/users/${ADMIN_ID}`)
      .set('Authorization', bearer('admin'))
      .send({ isActive: false });
    expect(res.status).toBe(400);
    expect(clientQuery).not.toHaveBeenCalled();
  });

  it('400 al modificarse a sí mismo con el id en mayúsculas', async () => {
    const res = await request(app)
      .patch(`/auth/admin/users/${ADMIN_ID.toUpperCase()}`)
      .set('Authorization', bearer('admin'))
      .send({ role: 'student' });
    expect(res.status).toBe(400);
  });

  it('409 si deja el sistema sin admin activo', async () => {
    clientQuery.mockResolvedValueOnce({ rows: [{ id: TARGET_ID }] });

    const res = await request(app)
      .patch(`/auth/admin/users/${TARGET_ID}`)
      .set('Authorization', bearer('admin'))
      .send({ isActive: false });

    expect(res.status).toBe(409);
    expect(clientQuery).toHaveBeenCalledTimes(1);
    expect(revokeAllUserTokens).not.toHaveBeenCalled();
  });

  it('permite desactivar a un admin si queda otro', async () => {
    clientQuery
      .mockResolvedValueOnce({ rows: [{ id: TARGET_ID }, { id: ADMIN_ID }] })
      .mockResolvedValueOnce({ rows: [{ ...targetRow, role: 'admin', is_active: false }] });

    const res = await request(app)
      .patch(`/auth/admin/users/${TARGET_ID}`)
      .set('Authorization', bearer('admin'))
      .send({ isActive: false });

    expect(res.status).toBe(200);
  });

  it('400 con id no UUID o body vacío', async () => {
    const a = await request(app).patch('/auth/admin/users/1').set('Authorization', bearer('admin')).send({ role: 'student' });
    const b = await request(app).patch(`/auth/admin/users/${TARGET_ID}`).set('Authorization', bearer('admin')).send({});
    expect(a.status).toBe(400);
    expect(b.status).toBe(400);
  });

  it('404 si el usuario no existe', async () => {
    clientQuery
      .mockResolvedValueOnce({ rows: [{ id: ADMIN_ID }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch(`/auth/admin/users/${TARGET_ID}`)
      .set('Authorization', bearer('admin'))
      .send({ role: 'student' });
    expect(res.status).toBe(404);
  });
});
