# Concilio — lanzador-run-bat

Profundidad: 2 (mecánico: script de arranque sobre el compose existente, sin tocar código ni contratos).

## Reutilización — APROBADO
- `docker compose up -d --wait` reutiliza los healthchecks y `depends_on: service_healthy` ya definidos; no
  hace falta un bucle de espera propio. `START.bat` no cubre el ítem (espera fija, prompts, web aparte):
  `run.bat` nuevo, sin duplicar sus subcomandos.

## Riesgo/QA — APROBADO CON CAMBIOS
- Riesgo 1: puerto de BD ocupado por un Postgres local (en esta PC 5432 lo usa otro proceso). Cambio exigido:
  leer `POSTGRES_PORT` del `.env` y, si está en LISTEN y `ux_postgres` no corre, avisar y salir sin matar nada.
- Riesgo 2: espera infinita. Cambio exigido: `--wait-timeout` explícito (600 s).
- Riesgo 3: nada destructivo (sin `down`, `-v`, `--build` forzado ni seeds); `pause` solo en errores.
- QA: correrlo de verdad, comprobar que responden web y `/health` de los servicios, y bajar solo lo levantado.
- Arquitectura de software / solución: APROBADO ambos (un .bat reversible).

VEREDICTO: APROBADO CON CAMBIOS
