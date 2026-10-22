import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { parseDurationToMs } from './duration';
import type { JwtPayload, RefreshTokenPayload, TokenPair, UserRole } from '../types/auth.types';

const ACCESS_EXPIRES_MS = parseDurationToMs(env.JWT_EXPIRES_IN, 900_000);
// Algoritmo fijo: un token firmado con otro algoritmo (aunque sea con el mismo secreto) no pasa.
const ALGORITHM = 'HS256' as const;
const REFRESH_SECRET    = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + '_refresh';

export function generateTokenPair(
  userId: string,
  email:  string,
  role:   UserRole
): TokenPair & { tokenId: string } {
  const tokenId = randomUUID();

  const accessPayload: JwtPayload = { sub: userId, email, role };
  const refreshPayload: RefreshTokenPayload = { sub: userId, tokenId };

  const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: ALGORITHM,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: ALGORITHM,
  } as jwt.SignOptions);

  return { accessToken, refreshToken, expiresIn: ACCESS_EXPIRES_MS / 1000, tokenId };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] }) as JwtPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET, { algorithms: [ALGORITHM] }) as RefreshTokenPayload;
}

