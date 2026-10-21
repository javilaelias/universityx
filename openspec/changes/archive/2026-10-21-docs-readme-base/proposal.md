# Propuesta: docs-readme-base

## Por qué
El repo no tiene `README.md`: quien lo clona no sabe qué es ni cómo arrancarlo. `PROGRESS.md` (2026-06-17)
expone credenciales de dev en claro y tiene ítems contradictorios (lms/sync/notification/helpdesk/media y
`/tickets` marcados hecho y pendiente a la vez); el estado vigente vive en `ESTADO_PROYECTO.md`.

## Qué cambia
- Nuevo `README.md`: qué es, stack, arranque (`START.bat`, `CERO.ps1`, `docker compose up -d --build`),
  servicios y puertos (de `docker-compose.yml`), tests, enlaces a docs. Sin credenciales: remite a `.env.example`.
- `PROGRESS.md` queda como **histórico congelado**: aviso al inicio que apunta a `ESTADO_PROYECTO.md`,
  tabla de credenciales reemplazada por referencia a `.env.example`, duplicados pendientes resueltos
  (se marcan hechos los que el ESTADO confirma; el resto se aclara).

## Fuera de alcance
Cambiar código, compose, scripts o `.env`. Reescribir el historial git (las credenciales son defaults de dev,
ya presentes en `docker-compose.yml`; no son secretos de producción).

## Integración / reuso
Solo documentación; no aplica componente nuevo.
