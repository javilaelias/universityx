import 'dotenv/config';
import express       from 'express';
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

async function start() {
  await pool.query('SELECT 1');
  console.log('[db] PostgreSQL connected');

  app.listen(Number(env.PORT), () => {
    console.log(`[server] helpdesk-service running on :${env.PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
