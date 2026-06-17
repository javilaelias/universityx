import 'dotenv/config';
import { env }  from './config/env';
import { pool } from './db/postgres';
import { app }  from './app';

async function start() {
  await pool.query('SELECT 1');
  console.log('[db] PostgreSQL connected');
  app.listen(Number(env.PORT), () =>
    console.log(`[server] credentials-service running on :${env.PORT}`),
  );
}

start().catch(err => { console.error(err); process.exit(1); });
