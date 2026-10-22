# Notas de versión — v1.0 "Piloto vendible" (2026-10-22)

Meta: que una academia use la plataforma con su marca, email real, respaldos y un admin sin SQL.

## Qué trae

- **Despliegue en VPS** — `docker-compose.staging.yml` toma los secretos solo del `.env` y no arranca si
  falta uno obligatorio; guía en `docs/06-despliegue.md`.
- **Respaldos** — `scripts/backup.sh` (pg_dump + mongodump, rotación, cron) y `scripts/restore.sh`.
- **Email real** — SMTP opcional en notification-service (sin `SMTP_HOST`, va al log); plantillas ES/EN.
- **Recuperar contraseña** — token de un solo uso (30 min), páginas `/forgot-password` y `/reset-password`.
- **Auth endurecida** — política de contraseñas, bloqueo tras 5 fallos, renovación del token en la web,
  validación de secretos y CORS en producción, headers de seguridad.
- **Panel admin** — `/admin`: usuarios (alta, rol, activar/desactivar), publicar cursos, cola de tickets.
- **Marca configurable** — bloque `BRAND_*` del `.env` (nombre, color, logo, favicon, pie) en web,
  emails, certificado PDF y PWA, sin tocar código (`docs/07-marca.md`).
- **Push FCM** — registro del token del dispositivo y envío con firebase-admin si hay
  `FCM_CREDENTIALS_FILE` (si no, solo in-app y email).
- **E2E Playwright** — flujo crítico, recuperar contraseña, smoke de `/admin`, ES/EN y tema; job en CI.
- **Lanzador** — `run.bat` (doble clic) y `CERO.ps1` / `CERO.sh`.

## Actualizar desde el MVP

1. Copiar las variables nuevas de `.env.example` al `.env` (`SMTP_*`, `BRAND_*`, `FCM_CREDENTIALS_FILE`,
   `JWT_REFRESH_SECRET`, `NEXTAUTH_*`).
2. En una BD existente, aplicar a mano las migraciones nuevas (en una BD vacía corren solas):
   `infra/migrations/008-password-reset.sql` y `009-device-tokens.sql`.
3. `docker compose up -d --build`.

## Límites conocidos (pasan a v1.1)

- La web no tiene visor de contenido ni "marcar como visto"; curso, quiz y perfil sin i18n.
- credentials, media, notification y sync no fijan el algoritmo del JWT.
- `/notifications/trigger` sin auth (solo red interna); lms y credentials aún no lo llaman.
- Push sin probar en un dispositivo real; Android sin marca configurable.
- Panel admin sin auditoría de acciones; SSO SAML/OIDC sigue como stub.
