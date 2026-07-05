import { env } from './env';

// Parse REDIS_URL into plain options BullMQ can use directly
// (avoids the ioredis version conflict when BullMQ bundles its own copy)
function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    host:                 u.hostname,
    port:                 Number(u.port) || 6379,
    password:             u.password ? decodeURIComponent(u.password) : undefined,
    maxRetriesPerRequest: null as null,
  };
}

export const redisConnection = parseRedisUrl(env.REDIS_URL);
