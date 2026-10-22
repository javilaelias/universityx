# ESTADO — UniversidadX

> Continuidad del proyecto para JuvinFactory. Conciso: estado + pendientes + hallazgos.
> Historial previo: `PROGRESS.md` y `docs/04-roadmap.md` (2026-06-17). Plan comercial: `plan_rentable.md`.

## Estado (2026-10-21)

- **Versión:** MVP hecho → en curso **v1.0 "Piloto vendible"** (ámbito comercial, white-label).
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
- **Calidad:** Vitest en auth, lms, credentials, media, notification; CI/CD GitHub Actions (ci, cd, release).

## Pendientes v1.0

Ver `cola-trabajo.md` (driver headless, se corre con `D:\JuvinFactory\juvinciclo.bat`).

## Hallazgos

- lms, credentials, media, helpdesk, notification y sync verifican JWT sin fijar `algorithms` (auth-service ya usa HS256 fijo).
- `/notifications/trigger` sin auth (solo red interna; staging lo publica en 127.0.0.1).
- notification-service sin FCM; el token del dispositivo no se registra.
- Sin panel de administración (solo instructor); marca fija en código.
- Email solo por consola en dev.
- `cd.yml` arma `.env.staging` en el runner y no lo copia al VPS (manda el `.env` del servidor).
- SSO SAML/OIDC: stub, sin IdP real.

## Presentaciones

- Presentación de portafolio mvp: omitida (2026-10-21) — el usuario la pidió para el cierre de v1.0.
