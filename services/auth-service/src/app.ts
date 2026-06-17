import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

// ── Seguridad ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  credentials: true,
}));
app.set('trust proxy', 1);

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', ts: new Date().toISOString() });
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

// ── Error handler (debe ir al final) ─────────────────────────────────────────
app.use(errorHandler);
