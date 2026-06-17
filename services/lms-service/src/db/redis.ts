import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env';

let client: RedisClientType;

export async function connectRedis(): Promise<void> {
  client = createClient({ url: env.REDIS_URL }) as RedisClientType;
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  console.log('✓ Redis conectado');
}

export function getRedis() { return client; }

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await client.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = env.CACHE_TTL_SEC) {
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function cacheInvalidate(pattern: string) {
  const keys = await client.keys(pattern);
  if (keys.length > 0) await client.del(keys);
}
