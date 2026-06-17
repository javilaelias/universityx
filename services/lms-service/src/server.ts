import 'dotenv/config';
import { app } from './app';
import { connectPostgres } from './db/postgres';
import { connectRedis } from './db/redis';
import { env } from './config/env';

async function start() {
  console.log(`\n🚀  lms-service  [${env.NODE_ENV}]`);

  await connectPostgres();
  await connectRedis();

  app.listen(env.PORT, () => {
    console.log(`✓  Escuchando en http://localhost:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/health`);
    console.log(`\n   Endpoints principales:`);
    console.log(`   GET    /api/dashboard`);
    console.log(`   GET    /api/courses`);
    console.log(`   GET    /api/courses/:id`);
    console.log(`   POST   /api/enrollments`);
    console.log(`   GET    /api/enrollments`);
    console.log(`   GET    /api/courses/:id/progress`);
    console.log(`   POST   /api/progress`);
    console.log(`   GET    /api/quizzes/:contentItemId`);
    console.log(`   POST   /api/quizzes/:contentItemId/submit`);
  });
}

process.on('SIGTERM', () => { console.log('SIGTERM — cerrando lms-service...'); process.exit(0); });
process.on('SIGINT',  () => { console.log('SIGINT  — cerrando lms-service...'); process.exit(0); });

start().catch((err) => { console.error('Error al iniciar lms-service:', err); process.exit(1); });
