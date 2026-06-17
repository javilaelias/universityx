import 'dotenv/config';
import express    from 'express';
import { env }   from './config/env';
import { pool }  from './db/postgres';
import syncRoutes from './routes/sync.routes';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'sync-service' }));
app.use('/sync', syncRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

async function start() {
  await pool.query('SELECT 1');
  console.log('[db] PostgreSQL connected');
  app.listen(Number(env.PORT), () => {
    console.log(`[server] sync-service running on :${env.PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
