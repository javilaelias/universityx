import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT:             z.string().default('4008'),
  DATABASE_URL:     z.string(),
  REDIS_URL:        z.string(),
  JWT_SECRET:       z.string(),
  NODE_ENV:         z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS:  z.string().default('http://localhost:3000'),
  // Directorio raíz de almacenamiento: <path>/originals y <path>/hls
  MEDIA_STORAGE_PATH: z.string().default('/data/media'),
  // Base URL accesible desde el navegador/Android para reproducir los .m3u8 (no proxeada por Next.js)
  MEDIA_EXTERNAL_URL: z.string().default('http://localhost:4008'),
  MAX_UPLOAD_MB:      z.string().default('500'),
});

export const env = schema.parse(process.env);
