import { z } from 'zod';

const schema = z.object({
  NODE_ENV:   z.enum(['development', 'test', 'production']).default('development'),
  PORT:       z.coerce.number().default(4001),

  // PostgreSQL
  DATABASE_URL: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // JWT
  JWT_SECRET:              z.string().min(32),
  JWT_EXPIRES_IN:          z.string().default('15m'),
  JWT_REFRESH_SECRET:      z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('7d'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // SSO (opcional en dev)
  SSO_ENTRY_POINT:   z.string().optional(),
  SSO_ISSUER:        z.string().optional(),
  SSO_CERT:          z.string().optional(),
  SSO_CALLBACK_URL:  z.string().optional(),
  WEB_BASE_URL:      z.string().url().optional(),
});

function loadEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error('❌  Variables de entorno inválidas:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = typeof env;
