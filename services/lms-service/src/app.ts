import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors({
  origin:      env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  credentials: true,
}));
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lms-service', ts: new Date().toISOString() });
});

app.use('/api', router);
app.use(errorHandler);
