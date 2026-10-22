import { z } from 'zod';

// Un token FCM ronda los 160 caracteres; el tope evita guardar basura arbitraria.
const token = z.string().trim().min(20).max(4096);

export const registerDeviceSchema = z.object({
  token,
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

export const unregisterDeviceSchema = z.object({ token });
