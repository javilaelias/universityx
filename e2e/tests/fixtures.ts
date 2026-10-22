import { test as base } from '@playwright/test';
import { randomInt } from 'node:crypto';

// auth-service limita login/registro a 10 por IP cada 15 min y la web le pasa la IP del cliente
// (último salto de X-Forwarded-For). Sin proxy delante, cada test se presenta con una IP propia
// (rango de documentación 198.18.0.0/15) para no agotar el cupo de la máquina que corre la suite.
export const test = base.extend({
  extraHTTPHeaders: async ({}, use) => {
    await use({ 'X-Forwarded-For': `198.18.${randomInt(256)}.${randomInt(1, 255)}` });
  },
});

export { expect } from '@playwright/test';
