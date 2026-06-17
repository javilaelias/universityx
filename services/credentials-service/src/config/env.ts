import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT:         z.string().default('4007'),
  DATABASE_URL: z.string(),
  JWT_SECRET:   z.string(),
  ISSUER_URL:   z.string().default('https://universidadx.com'),
  ISSUER_NAME:  z.string().default('Universidad X'),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
});

export const env = schema.parse(process.env);
