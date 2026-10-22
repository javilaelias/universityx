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
  // Vacío = BRAND_NAME <no-reply@universidadx.com> (ver mailFrom en config/brand.ts)
  SMTP_FROM:    z.string().default(''),
  // URL pública de la web: el enlace de reset de contraseña solo puede apuntar ahí
  WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
  // Push FCM — ruta al JSON de la cuenta de servicio de Firebase. Vacío = sin push (solo in-app + email)
  FCM_CREDENTIALS_FILE: z.string().default(''),
});

export const env = schema.parse(process.env);
