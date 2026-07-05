import 'dotenv/config';
import { env }  from './config/env';
import { pool } from './db/postgres';
import { app }  from './app';
import { startTranscodeWorker } from './queues/transcode.worker';

async function start() {
  await pool.query('SELECT 1');
  console.log('[db] PostgreSQL connected');

  startTranscodeWorker();
  console.log('[worker] Transcode worker started');

  app.listen(Number(env.PORT), () => {
    console.log(`[server] media-service running on :${env.PORT}`);
  });
}

start().catch((err) => { console.error(err); process.exit(1); });
