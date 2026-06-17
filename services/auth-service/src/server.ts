import 'dotenv/config';
import { app } from './app';
import { connectPostgres } from './db/postgres';
import { connectRedis } from './db/redis';
import { env } from './config/env';

async function start() {
  console.log(`\n🚀  auth-service  [${env.NODE_ENV}]`);

  await connectPostgres();
  await connectRedis();

  app.listen(env.PORT, () => {
    console.log(`✓  Escuchando en http://localhost:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/health`);
    console.log(`\n   Endpoints disponibles:`);
    console.log(`   POST  /auth/register`);
    console.log(`   POST  /auth/login`);
    console.log(`   POST  /auth/refresh`);
    console.log(`   POST  /auth/logout`);
    console.log(`   GET   /auth/me              (requiere Bearer token)`);
    console.log(`   POST  /auth/logout-all      (requiere Bearer token)`);
    console.log(`   POST  /auth/sso/provision   (JIT: Google / Microsoft)`);
    console.log(`   POST  /auth/sso/exchange-code (SAML one-time code)`);
    console.log(`   GET   /auth/sso/saml/metadata`);
    console.log(`   GET   /auth/sso/init        (SAML redirect → IdP)`);
    console.log(`   POST  /auth/sso/callback    (SAML ACS)`);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT',  gracefulShutdown);

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} recibido — cerrando auth-service...`);
  process.exit(0);
}

start().catch((err) => {
  console.error('Error al iniciar auth-service:', err);
  process.exit(1);
});
