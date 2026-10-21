# Concilio — docs-readme-base

Profundidad: 2 (mecánico, solo documentación; sin contrato, sin código, sin superficie de seguridad nueva).

## Reutilización — APROBADO
- Los puertos y servicios se toman de `docker-compose.yml` (fuente de verdad), no de `START.bat`/`PROGRESS.md`
  (verificado: `START.bat` dice Postgres `5436` y pgAdmin `admin@universidadx.com`; `PROGRESS.md` dice
  Mongo Express `8081` y `admin@universidadx.local`; el compose expone `5432` y `8082`). El README remite a
  `.env.example` para variables y credenciales, y a `docs/` y `ESTADO_PROYECTO.md` en vez de duplicarlos.

## Riesgo/QA — APROBADO CON CAMBIOS
- Riesgo: README que repite credenciales o puertos erróneos. Mitigación: tarea 5 (grep de contraseñas) y
  puertos copiados del compose con nota de que se cambian por `.env`.
- Arquitectura de software / solución: no aplica (sin cambio de código ni stack) — APROBADO ambos.
- Cambio exigido: el README advierte que `START.bat reset` / `CERO.ps1 -Reset` borran volúmenes.
- Reversa: `git revert` del commit; sin efecto en ejecución.

VEREDICTO: APROBADO CON CAMBIOS
