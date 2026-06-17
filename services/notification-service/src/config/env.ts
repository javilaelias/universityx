import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT:         z.string().default('4003'),
  DATABASE_URL: z.string(),
  REDIS_URL:    z.string(),
  JWT_SECRET:   z.string(),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  // SMTP — dev mode uses console transport
  SMTP_HOST:    z.string().default('console'),
  SMTP_PORT:    z.string().default('587'),
  SMTP_USER:    z.string().default(''),
  SMTP_PASS:    z.string().default(''),
  SMTP_FROM:    z.string().default('Universidad X <no-reply@universidadx.com>'),
});

export const env = schema.parse(process.env);
