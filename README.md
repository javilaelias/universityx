# Universidad X

Plataforma educativa (LMS) white-label: web Next.js 14 + app Android (Kotlin) sobre microservicios
Node.js/TypeScript y Python. Cursos con módulos y quizzes, progreso offline con sincronización,
tickets de soporte, notificaciones, recomendaciones, credenciales Open Badges 3.0 y video HLS.

Estado vigente y pendientes: [`ESTADO_PROYECTO.md`](ESTADO_PROYECTO.md). Plan comercial: [`plan_rentable.md`](plan_rentable.md).

## Requisitos

- Docker Desktop (con Docker Compose v2).
- Node.js 20+ solo si se corre el frontend o los tests fuera de Docker.
- Android Studio para la app de `android/`.

## Arranque

1. Copiar las variables: `copy .env.example .env` (en la raíz). Cada servicio con `env_file` en el compose
   necesita además su `services/<servicio>/.env` (no hay plantilla por servicio: las URLs de BD y Redis las
   inyecta el compose; el resto se toma de `.env.example`). Nunca commitear un `.env`.
2. Levantar todo:
   - `START.bat` — verifica Docker y corre `docker compose up -d`. Subcomandos: `stop`, `status`, `logs`,
     `web` (Next.js en modo dev) y `reset`.
   - `CERO.ps1` — mismo arranque desde PowerShell (`-Stop`, `-Status`, `-Reset`).
   - O directo: `docker compose up -d --build`.
3. Abrir http://localhost:3000.

> **Cuidado:** `START.bat reset` y `CERO.ps1 -Reset` hacen `docker compose down -v`: borran los volúmenes
> (todos los datos de PostgreSQL, MongoDB y Redis).

## Servicios y puertos

Puertos por defecto de `docker-compose.yml`; los marcados con `*` se cambian en `.env`.

- `web` — Next.js — **3000**\*
- `auth-service` — login, JWT, refresh tokens, SSO SAML (opcional) — **4001**
- `lms-service` — cursos, módulos, matrículas, progreso, quizzes, dashboard — **4002**
- `notification-service` — cola BullMQ, in-app y email — **4003**
- `helpdesk-service` — tickets y mensajes — **4004**
- `sync-service` — reconciliación offline con idempotency keys — **4005**
- `ai-service` — perfiles y recomendaciones (Python/FastAPI) — **4006**
- `credentials-service` — Open Badges 3.0 y PDF — **4007**
- `media-service` — transcodificación a HLS con FFmpeg — **4008**\*
- `postgres` (PostgreSQL 16) — **5432**\* · `mongodb` (MongoDB 7) — **27017**\* · `redis` (Redis 7) — **6379**\*
- `pgadmin` — http://localhost:5050\* · `mongo-express` — http://localhost:8082\*

Usuarios y contraseñas de las bases y paneles: ver `.env.example` (los valores por defecto son solo para
desarrollo local; en un piloto real se cambian todos: ver [`docs/06-despliegue.md`](docs/06-despliegue.md)).

## Tests

Vitest en los servicios Node: `cd services/<servicio> && npm test` (auth, lms, credentials, media).
CI en `.github/workflows/` (`ci.yml`, `cd.yml`, `release.yml`).

### E2E (Playwright)

`e2e/` recorre en Chromium el flujo crítico (registro/login → matrícula → contenido → quiz → certificado →
`/verify` público), recuperar contraseña, un smoke de `/admin` e idioma ES/EN + tema claro/oscuro.

```bash
docker compose up -d --wait web          # pila completa con la BD sembrada (migraciones 004/005)
cd e2e && npm ci && npx playwright install chromium
npx playwright test                      # E2E_BASE_URL y E2E_DATABASE_URL si no son los de dev
```

- Crea usuarios propios (`*@e2e.test`) en cada corrida y siembra en Postgres el token de recuperación (el correo
  va a consola). Úsala contra una BD de desarrollo o descartable, nunca contra la de un cliente.
- En CI corre en el job `e2e` de `ci.yml` con `.env` de servicios descartables (`e2e/ci-env.sh`).

## Documentación

- [`docs/01-architecture.md`](docs/01-architecture.md) — arquitectura y flujos (SSO, sync offline).
- [`docs/02-database-schema.sql`](docs/02-database-schema.sql) — esquema PostgreSQL; migraciones en `infra/migrations/`.
- [`docs/03-ux-flow-offline.md`](docs/03-ux-flow-offline.md) — experiencia offline.
- [`docs/04-roadmap.md`](docs/04-roadmap.md) — roadmap.
- [`docs/05-manual-usuario.md`](docs/05-manual-usuario.md) — manual de usuario.
- [`docs/06-despliegue.md`](docs/06-despliegue.md) — despliegue en un VPS (`docker-compose.staging.yml`, secretos por `.env`).
- [`docs/07-marca.md`](docs/07-marca.md) — marca configurable (white-label) por el bloque `BRAND_*` del `.env`.
- [`PROGRESS.md`](PROGRESS.md) — registro histórico hasta 2026-06-17 (congelado).
