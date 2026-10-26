# Tareas — puerto-web-3300

- [x] `docker-compose.yml`: `WEB_PORT` default 3300; `NEXTAUTH_URL` derivado de `WEB_PORT` (auth, notification, media, web);
      `ALLOWED_ORIGINS` en `auth` y `lms`; comentarios de cabecera
- [x] Validar la interpolación anidada con `docker compose config` (default, `WEB_PORT=3400` y `NEXTAUTH_URL` explícito)
- [x] `run.bat`, `.env.example`, `README.md`, `CERO.sh`, `e2e/playwright.config.ts`, `PENDIENTES-USUARIO.md`
- [x] Recrear solo `web`, `auth`, `lms`, `notification` y `media` (`up -d`, sin `down`) y comprobar http://localhost:3300
- [x] `/code-review low`, tests en verde, archivar, `ESTADO_PROYECTO.md` y cierre con `cerrar-proyecto.ps1`
