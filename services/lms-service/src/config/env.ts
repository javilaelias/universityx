import { z } from 'zod';

const schema = z.object({
  NODE_ENV:       z.enum(['development', 'test', 'production']).default('development'),
  PORT:           z.coerce.number().default(4002),
  DATABASE_URL:   z.string().min(1),
  REDIS_URL:      z.string().min(1),
  JWT_SECRET:     z.string().min(32),
  ALLOWED_ORIGINS:z.string().default('http://localhost:3000'),
  CDN_BASE_URL:   z.string().default('http://localhost:9000'),
  CACHE_TTL_SEC:  z.coerce.number().default(300),
});

function loadEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error('❌  Variables de entorno inválidas:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
