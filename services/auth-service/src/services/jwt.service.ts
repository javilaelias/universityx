import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import type { JwtPayload, RefreshTokenPayload, TokenPair, UserRole } from '../types/auth.types';

const ACCESS_EXPIRES_MS = parseDurationToMs(env.JWT_EXPIRES_IN);
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
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken, expiresIn: ACCESS_EXPIRES_MS / 1000, tokenId };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

function parseDurationToMs(duration: string): number {
  const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900_000; // 15 min default
  return parseInt(match[1]) * (units[match[2]] ?? 1000);
}
