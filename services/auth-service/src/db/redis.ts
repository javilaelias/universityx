import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient({ url: env.REDIS_URL }) as RedisClientType;
  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();
  console.log('✓ Redis conectado');
}

export function getRedis(): RedisClientType {
  if (!redisClient) throw new Error('Redis no inicializado');
  return redisClient;
}

// ── Refresh token store ───────────────────────────────────────────────────────
// Key: `rt:<userId>:<tokenId>`  Value: "1"  TTL: tiempo de expiración del RT

const RT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días

export async function storeRefreshToken(
  userId: string,
  tokenId: string
): Promise<void> {
  await getRedis().set(`rt:${userId}:${tokenId}`, '1', {
    EX: RT_TTL_SECONDS,
  });
}

export async function validateRefreshToken(
  userId: string,
  tokenId: string
): Promise<boolean> {
  const val = await getRedis().get(`rt:${userId}:${tokenId}`);
  return val === '1';
}

export async function revokeRefreshToken(
  userId: string,
  tokenId: string
): Promise<void> {
  await getRedis().del(`rt:${userId}:${tokenId}`);
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  const keys = await getRedis().keys(`rt:${userId}:*`);
  if (keys.length > 0) await getRedis().del(keys);
}

// ── Límite de solicitudes de reset por email ─────────────────────────────────
// Key: `pwreset:<sha256(email)>`  Value: contador  TTL: 1 h desde la primera

const RESET_WINDOW_SECONDS = 60 * 60;

export async function countResetRequest(emailHash: string): Promise<number> {
  const key = `pwreset:${emailHash}`;
  // SET NX EX crea la clave ya con TTL: el contador nunca queda sin vencimiento.
  const [, count] = await getRedis()
    .multi()
    .set(key, '0', { EX: RESET_WINDOW_SECONDS, NX: true })
    .incr(key)
    .exec();
  return Number(count);
}
