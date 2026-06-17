import 'dotenv/config';
import express            from 'express';
import { env }            from './config/env';
import { pool }           from './db/postgres';
import notificationRoutes from './routes/notification.routes';
import { startNotificationWorker } from './queues/notification.worker';

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use('/notifications', notificationRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

async function start() {
  await pool.query('SELECT 1');
  console.log('[db] PostgreSQL connected');

  startNotificationWorker();
  console.log('[worker] Notification worker started');

  app.listen(Number(env.PORT), () => {
    console.log(`[server] notification-service running on :${env.PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
