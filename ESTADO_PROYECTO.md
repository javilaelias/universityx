# ESTADO — UniversidadX

> Continuidad del proyecto para JuvinFactory. Conciso: estado + pendientes + hallazgos.
> Historial previo: `PROGRESS.md` y `docs/04-roadmap.md` (2026-06-17). Plan comercial: `plan_rentable.md`.

## Estado (2026-10-22)

- **Versión:** **v1.0 "Piloto vendible"** cerrada (2026-10-22; ámbito comercial, white-label). Notas: `docs/07-notas-v1.0.md`.
- **Backend:** 8 servicios — auth `4001`, lms `4002`, notification `4003`, helpdesk `4004`, sync `4005`,
  ai `4006` (FastAPI), credentials `4007` (Open Badges 3.0 + PDF), media `4008` (FFmpeg/HLS).
- **Web (Next.js 14):** dashboard, catálogo, curso, quiz, tickets, perfil con badges, panel instructor,
  `/verify/[id]`, PWA, modo oscuro, i18n ES/EN.
- **Android (Kotlin):** login + biometría, offline (Room + SyncWorker), descargas, ExoPlayer, FCM (solo cliente).
- **Docs:** `README.md` (arranque, servicios y puertos); `PROGRESS.md` congelado como histórico, sin credenciales (2026-10-21).
- **Despliegue:** `docs/06-despliegue.md` (VPS); `docker-compose.staging.yml` toma secretos solo del `.env` y falla si falta uno; `.env.example` completo (2026-10-21).
- **Respaldos:** `scripts/backup.sh` (pg_dump + mongodump, rotación N días, cron) y `scripts/restore.sh`; backup → restore probado en local (guía §7, 2026-10-21).
- **Email:** notification-service envía por SMTP si hay `SMTP_HOST` (si falta o es `console`, al log); plantillas ES/EN (matrícula, ticket, certificado emitido, quiz, sesión) con `locale` opcional en `/trigger`. Falta que lms y credentials llamen a `/trigger` (2026-10-21).
- **Recuperar contraseña:** `POST /auth/forgot-password` (202 genérico, límite 3/h por email) y `/auth/reset-password` (token un solo uso, SHA-256 en BD, 30 min, revoca sesiones); páginas `/forgot-password` y `/reset-password`; migración 008 manual en BD existente (2026-10-21).
- **Auth endurecida:** política de contraseñas (10+, letra y número, sin comunes ni email), bloqueo 15 min tras 5 fallos por email, renovación del access JWT en la web (`SessionKeeper`, refresh fuera del navegador), secretos y CORS validados en production, HS256 fijo y headers de seguridad en la web (2026-10-21).
- **Panel admin:** `/admin` (rol admin) — usuarios (listar, crear, rol, activar/desactivar; revoca sesiones, protege último admin), todos los cursos (publicar/despublicar) y cola de tickets staff; endpoints con `requireRole` en auth/lms/helpdesk; `PATCH /courses/:id` con dueño/admin + lista blanca (2026-10-21).
- **Marca configurable:** bloque `BRAND_*` del `.env` (nombre, color primario → paleta `brand-*`, logo, favicon, ícono PWA, pie) leído en runtime por web, emails y certificado PDF; vacío = Universidad X (`docs/07-marca.md`, 2026-10-21).
- **Push FCM:** `POST/DELETE /notifications/devices` (JWT, tabla `device_tokens`, migración 009 manual en BD existente); el worker envía con firebase-admin si hay `FCM_CREDENTIALS_FILE` (si no, solo in-app + email), best-effort, y borra los tokens caducados; Android registra el token en el login y en `onNewToken` y lo desregistra en el logout (plugin google-services solo con `google-services.json`) (2026-10-22).
- **Lanzador:** `run.bat` (doble clic) levanta todo con `docker compose up -d --wait` (hasta 3 reintentos), abre la web y avisa si el puerto de la BD está ocupado; nunca borra datos. El web se publica en `WEB_PORT` (default **3300**, antes 3000: otro proyecto de esta PC ocupa el 3000) y `NEXTAUTH_URL`/CORS siguen a ese puerto; el job E2E del CI fija `WEB_PORT=3000`. Verificado el 2026-10-26: con RAM libre el stack queda sano y http://localhost:3300 responde (login, `/api/auth/providers`); con ~0,6 GB libres los servicios tardan más que la ventana del healthcheck y `--wait` falla (2026-10-26).
- **Cierre puerto-web-3300 (2026-10-26):** concilio 2 (APROBADO CON CAMBIOS, aplicados). Puerta de salida `/code-review low`: el skill devolvió vacío en 2 intentos, así que se revisó el diff a mano. 1 hallazgo (el job E2E del CI habría quedado fuera del 3000), corregido; sin descartados. Sin UI tocada. No se corrieron los tests de los servicios (no cambió código de servicios).
- **Calidad:** Vitest en auth, lms, credentials, media, notification; CI/CD GitHub Actions (ci, cd, release).
- **E2E (Playwright):** `e2e/` — flujo crítico (login → matrícula → contenido → quiz → certificado → `/verify`), recuperar contraseña, smoke `/admin`, ES/EN + tema; job `e2e` en `ci.yml`. Arregló curso/quiz rotos en la web (adaptadores BFF `lib/lms-shape.ts`), "Reclamar credenciales" (`POST /credentials` sin body, IDOR cerrado) y el atajo de quiz por `/progress` (2026-10-21).

## Pendientes

Cola v1.0 vacía. Lo próximo (v1.1) sale de los hallazgos de abajo.

## Cierre de lote (JuvinRelease, 2026-10-22)

- [ ] CERO.ps1/CERO.sh ejecutado desde cero — SKIP: compose con `container_name` y puertos fijos no se aísla con `-p`; correrlo pisa la BD de trabajo
- [x] migraciones aplicadas sobre BD vacía (Postgres 16 descartable con los mismos init: esquema + 002–009, 23 tablas)
- [x] .env.example reconciliado con .env (cubre todas las variables de ambos compose; el `.env` de trabajo tiene claves heredadas sin uso y no se tocó)

## Hallazgos

- La web no tiene visor de contenido ni "marcar como visto": un alumno no llega al 100 % desde la UI (la E2E usa `/api/progress`).
- Páginas de curso, quiz y perfil sin i18n; tema por defecto `light` en vez de `prefers-color-scheme`.
- credentials: `badges` sin UNIQUE(course_id) y emisión sin transacción (posible credencial duplicada con reclamos simultáneos).
- `.gitattributes` fuerza LF en `*.sh`: un clon viejo en Windows con `init-db.sh` en CRLF no inicializa la BD (re-checkout).

- credentials, media, notification y sync verifican JWT sin fijar `algorithms` (auth, lms y helpdesk ya usan HS256 fijo).
- Panel admin sin smoke en navegador real (solo estático) y sin auditoría de acciones; desactivar deja vivo el access JWT ≤ 15 min.
- `/notifications/trigger` sin auth (solo red interna; staging lo publica en 127.0.0.1).
- Push FCM sin probar en un dispositivo real; el build Android no se verificó (no hay gradlew en el repo).
- Android sin marca configurable (nombre e íconos nativos fijos).
- `navigateFallback: '/offline'` de la PWA apunta a una URL que el SW no precachea (preexistente).
- Email solo por consola en dev.
- `cd.yml` arma `.env.staging` en el runner y no lo copia al VPS (manda el `.env` del servidor).
- SSO SAML/OIDC: stub, sin IdP real.
- `CERO.ps1` guardado con doble codificación UTF-8 (tildes y recuadros ilegibles al imprimir).

## Presentaciones

- Presentación de portafolio mvp: omitida (2026-10-21) — el usuario la pidió para el cierre de v1.0.
- Presentación de portafolio v1_0: https://claude.ai/artifact/9rHUcXXpFgRrdVaCnz8n6j (2026-10-22)
