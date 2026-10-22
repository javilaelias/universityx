import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { envSchema } from '../config/env';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../services/jwt.service';

const SECRET = process.env.JWT_SECRET!;
const userId = '11111111-1111-1111-1111-111111111111';

describe('JWT con algoritmo fijo', () => {
  it('acepta los tokens que emite el servicio', () => {
    const { accessToken, refreshToken, tokenId } = generateTokenPair(userId, 'a@x.test', 'student');
    expect(verifyAccessToken(accessToken).sub).toBe(userId);
    expect(verifyRefreshToken(refreshToken).tokenId).toBe(tokenId);
  });

  it('rechaza un token HS512 firmado con el mismo secreto', () => {
    const forged = jwt.sign({ sub: userId, email: 'a@x.test', role: 'admin' }, SECRET, { algorithm: 'HS512' });
    expect(() => verifyAccessToken(forged)).toThrow(/invalid algorithm/);
  });
});

describe('variables de entorno en production', () => {
  const base = {
    NODE_ENV:           'production',
    DATABASE_URL:       'postgres://x',
    REDIS_URL:          'redis://x',
    JWT_SECRET:         'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    WEB_BASE_URL:       'https://academia.test',
    ALLOWED_ORIGINS:    'https://academia.test',
  };
  const fieldErrors = (env: Record<string, string | undefined>) => {
    const r = envSchema.safeParse(env);
    return r.success ? {} : r.error.flatten().fieldErrors;
  };

  it('acepta una configuración completa', () => {
    expect(envSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ['sin JWT_REFRESH_SECRET',      { JWT_REFRESH_SECRET: undefined },        'JWT_REFRESH_SECRET'],
    ['refresh igual al de access',  { JWT_REFRESH_SECRET: 'a'.repeat(32) },   'JWT_REFRESH_SECRET'],
    ['ALLOWED_ORIGINS con comodín', { ALLOWED_ORIGINS: 'https://a.test, *' }, 'ALLOWED_ORIGINS'],
    ['duración en otro formato',    { JWT_REFRESH_EXPIRES_IN: '30 days' },    'JWT_REFRESH_EXPIRES_IN'],
  ])('rechaza %s', (_c, patch, field) => {
    expect(fieldErrors({ ...base, ...patch })).toHaveProperty(field);
  });

  it('en development no exige el secreto de refresh', () => {
    expect(envSchema.safeParse({ ...base, NODE_ENV: 'development', JWT_REFRESH_SECRET: undefined }).success).toBe(true);
  });
});
