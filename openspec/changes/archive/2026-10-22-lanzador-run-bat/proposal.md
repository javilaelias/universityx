# Propuesta — lanzador-run-bat

## Por qué
Falta un lanzador de doble clic que levante la app completa y abra el navegador. `START.bat` solo levanta la
infraestructura con una espera fija de 10 s, pregunta por consola y deja el frontend aparte (`START.bat web`):
no cumple, así que `run.bat` no lo llama.

## Qué cambia
- `run.bat` nuevo en la raíz. En este repo BD, microservicios (4001–4008) y web (3000) son servicios del
  mismo `docker-compose.yml`, así que no hay ventanas separadas de backend/frontend: un solo
  `docker compose up -d --wait` levanta todo y espera los healthchecks (BD sana antes que los servicios, por
  los `depends_on: service_healthy` ya existentes). Después abre `http://localhost:<WEB_PORT>`.
- Lee `POSTGRES_PORT`/`WEB_PORT` del `.env` raíz (defaults 5432/3000, los del compose).
- Si el puerto de la BD está ocupado por otra cosa (y `ux_postgres` no corre), lo dice y sale sin matar nada.
- Nunca destructivo: sin `down`, `-v`, seeds ni reset. `pause` solo ante error.
- `START.bat` queda como está (stop/status/logs/reset).

## Veredicto de integración
No es app ni feature nueva: script de arranque del mismo repo.

## Reutilización
Docker Compose (`--wait`) y los healthchecks ya definidos; sin dependencias nuevas.
