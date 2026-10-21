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

  // Base de los enlaces que salen por correo (reset de contraseña): nunca se toma del Host.
  WEB_BASE_URL:      z.string().url().optional(),

  // Servicio interno de notificaciones (email)
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:4003'),
}).refine((e) => e.NODE_ENV !== 'production' || !!e.WEB_BASE_URL, {
  message: 'WEB_BASE_URL es obligatoria en production',
  path:    ['WEB_BASE_URL'],
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

// URL pública de la web: de la configuración (nunca del Host de la petición).
export function webBaseUrl(): string {
  return (env.WEB_BASE_URL ?? env.ALLOWED_ORIGINS.split(',')[0].trim()).replace(/\/+$/, '');
}
