# Propuesta — puerto-web-3300

## Por qué
El web de Docker publica `3000` por defecto, y en esta PC ese puerto ya lo tiene otro proyecto (Ewocar/Nostalgia,
vía `wslrelay` en `127.0.0.1:3000`). `localhost` resuelve a esa dirección antes que al `0.0.0.0` de Docker, así que
al abrir `run.bat` el navegador mostraba el otro proyecto y no UniversidadX. Los demás proyectos de la fábrica
usan 3000/3001 (registro), por eso este se mueve a `3300`, libre y fuera de ese rango.

## Qué cambia
- `docker-compose.yml`: `WEB_PORT` por defecto `3300` (era 3000). El puerto interno del contenedor sigue en 3000.
  La URL pública del web se deriva del mismo puerto: `NEXTAUTH_URL` por defecto pasa a
  `http://localhost:${WEB_PORT:-3300}` (antes fijo en 3000), así NextAuth, los enlaces de notificaciones y el
  CORS no se desalinean. `auth` y `lms` reciben `ALLOWED_ORIGINS` desde esa misma URL (antes lo leían de su
  `.env` local con 3000; `media` ya lo hacía).
- `run.bat`: puerto por defecto 3300 (sigue leyendo `WEB_PORT` del `.env`).
- `.env.example`: `NEXTAUTH_URL`/`WEB_PORT` a 3300. `README.md`, `CERO.sh` y `PENDIENTES-USUARIO.md` con el puerto nuevo.
- `e2e/playwright.config.ts`: default local a 3300 (CI fija `E2E_BASE_URL` y no cambia).

- `.github/workflows/ci.yml`: el job `e2e` fija `WEB_PORT: "3000"`. Ese job levanta el stack con este mismo compose y
  `E2E_BASE_URL` apunta al 3000; sin esto el web quedaría publicado en 3300 y el E2E fallaría (hallado en la revisión de salida).

## Fuera de alcance
- `docker-compose.staging.yml` (su propio default y `NEXTAUTH_URL` obligatorio) y `e2e/ci-env.sh`.
- El servidor `npm run dev` fuera de Docker (`START.bat web`, `CERO.ps1`, `web/.env.local`): sigue en 3000.

## Veredicto de integración
No es app ni feature nueva: ajuste de configuración del mismo repo.

## Reutilización
Variable `WEB_PORT` y la interpolación con default de Compose; sin dependencias nuevas.

## Reversa
`WEB_PORT=3000` y `NEXTAUTH_URL=http://localhost:3000` en `.env`, o `git revert` del commit.
