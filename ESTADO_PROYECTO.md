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
- **Calidad:** Vitest en auth, lms, credentials, media; CI/CD GitHub Actions (ci, cd, release).

## Pendientes v1.0

Ver `cola-trabajo.md` (driver headless, se corre con `D:\JuvinFactory\juvinciclo.bat`).

## Hallazgos

- Sin recuperación de contraseña en auth-service.
- notification-service sin FCM; el token del dispositivo no se registra.
- Sin panel de administración (solo instructor); marca fija en código.
- Email solo por consola en dev; sin respaldos automáticos.
- `cd.yml` arma `.env.staging` en el runner y no lo copia al VPS (manda el `.env` del servidor).
- SSO SAML/OIDC: stub, sin IdP real.

## Presentaciones

- Presentación de portafolio mvp: omitida (2026-10-21) — el usuario la pidió para el cierre de v1.0.
