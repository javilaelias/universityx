import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT:         z.string().default('4007'),
  DATABASE_URL: z.string(),
  JWT_SECRET:   z.string(),
  ISSUER_URL:   z.string().default('https://universidadx.com'),
  // Vacío = BRAND_NAME (marca configurable) o 'Universidad X'.
  ISSUER_NAME:  z.preprocess(
    v => (typeof v === 'string' && v.trim() ? v.trim() : process.env.BRAND_NAME?.trim() || 'Universidad X'),
    z.string(),
  ),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
});

export const env = schema.parse(process.env);
