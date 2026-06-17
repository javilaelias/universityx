import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT:         z.string().default('4005'),
  DATABASE_URL: z.string(),
  JWT_SECRET:   z.string(),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
});

export const env = schema.parse(process.env);
