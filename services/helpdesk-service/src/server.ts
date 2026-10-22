import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { env }       from './config/env';
import { pool }      from './db/postgres';
import ticketRoutes  from './routes/ticket.routes';

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'helpdesk-service' }));
app.use('/api/tickets', ticketRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  // Errores del cliente (JSON mal formado 400, body grande 413) conservan su código.
  if (err.status && err.status < 500) { res.status(err.status).json({ message: 'Solicitud inválida' }); return; }
  console.error('[error]', err.message);
  res.status(500).json({ message: 'Error interno' });
});

async function start() {
  await pool.query('SELECT 1');
  console.log('[db] PostgreSQL connected');

  app.listen(Number(env.PORT), () => {
    console.log(`[server] helpdesk-service running on :${env.PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
