import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT:                   z.string().default('4004'),
  DATABASE_URL:           z.string(),
  JWT_SECRET:             z.string(),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  NOTIFICATION_SERVICE_URL: z.string().default('http://localhost:4003'),
});

export const env = schema.parse(process.env);
