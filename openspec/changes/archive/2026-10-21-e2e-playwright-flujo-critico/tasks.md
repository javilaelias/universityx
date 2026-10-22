# Tareas — e2e-playwright-flujo-critico

- [x] 1. credentials-service `issue`: `userId` del token (admin puede indicar otro), `courseId` opcional → emite
  todas las matrículas al 100 % sin certificado; 422 si no hay; tests Vitest de los casos nuevos.
- [x] 2. `e2e/`: `package.json` (`@playwright/test`, `pg`), `playwright.config.ts` (baseURL por `E2E_BASE_URL`,
  chromium, 1 worker, trazas al fallar), helpers (registro de estudiante único, login, token de reset en BD).
- [x] 3. Specs: flujo crítico, recuperar contraseña, smoke admin, i18n + tema.
- [x] 4. `e2e/ci-env.sh` + job `e2e` en `.github/workflows/ci.yml`; `.gitignore` de reportes.
- [x] 5. Correr la suite local contra la pila Docker (volúmenes recién creados, no una BD de trabajo) dos veces seguidas sin reset y dejarla en verde; Vitest de credentials en verde.
- [x] 6. README (cómo correr la E2E) y ESTADO.

- [x] 7. (addendum) Adaptadores BFF de curso y quiz (`web/src/lib/lms-shape.ts`), `correct`/`total` en lms, `enrolled` en la página del curso.

## Cierre

Puerta de salida: `/code-review high` — 10 hallazgos; corregidos 4 (bypass del quiz vía `POST /progress` → 422 en lms;
`issue` async sin try/catch → 500; carrera de `progress_pct` tras el quiz → recálculo con await; `ISSUER_NAME` fijo en
`ci-env.sh`); descartados 6 con motivo (badges sin UNIQUE y sin transacción: preexistentes, piden migración; `toQuiz`
sin `attempts_left`: la página nunca los usó; tipos de `lib/api.ts`: adaptador deliberado porque Android usa la forma
lms; N+1 del reclamo: N chico; tema default sin `prefers-color-scheme`: preexistente, hallazgo en ESTADO).
`/security-review`: sin hallazgos ≥ 8. UI: se manejó en Chromium el flujo registro → login → catálogo → curso →
matrícula → quiz aprobado → perfil "Reclamar credenciales" → `/verify` sin sesión + PDF; `/forgot-password` y
`/reset-password`; `/admin` (usuarios con búsqueda, cursos, tickets); toggle ES/EN y claro/oscuro con persistencia.
Validación: Playwright 6/6 en pila Docker local (volúmenes nuevos, repetida sin reset); Vitest credentials 19/19, lms 20/20;
tsc web y e2e OK. QA juvinqa (Nivel 1 + 2): APROBADO. No probado: el job `e2e` en GitHub Actions (corre al pushear).
