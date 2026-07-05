import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { join } from 'path';
import { env } from './config/env';
import { router } from './routes/media.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
}));
app.set('trust proxy', 1);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'media-service', ts: new Date().toISOString() });
});

app.use('/api/media', router);

// Archivos HLS servidos directamente al navegador/Android (URL pública en content_url)
app.use('/media/hls', express.static(join(env.MEDIA_STORAGE_PATH, 'hls'), {
  setHeaders(res, path) {
    if (path.endsWith('.m3u8')) res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    else if (path.endsWith('.ts')) res.setHeader('Content-Type', 'video/mp2t');
  },
}));

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);
