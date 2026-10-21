# Concilio — respaldos-pg-mongo

Profundidad: 2 (mecánico: scripts operativos con las herramientas nativas de cada motor; sin código de servicios,
sin contrato de API, sin stack nuevo).

## Reutilización — APROBADO
- `pg_dump`/`pg_restore` y `mongodump`/`mongorestore` vienen en las imágenes ya usadas; cron del sistema para
  programar. Se extiende la §7 existente de la guía en vez de un documento nuevo. No se agrega contenedor de
  respaldo (p. ej. imágenes de terceros tipo `postgres-backup-local`): dos motores, un script basta.

## Riesgo/QA — APROBADO CON CAMBIOS
- Riesgo 1: los volúmenes tienen `name:` fijo (`ux_postgres_data`…): una prueba con otro proyecto Compose sobre el
  `docker-compose.yml` reusaría los datos de trabajo. Cambio exigido: probar con un compose descartable propio
  (sin `name:` fijo, sin puertos) y `down -v` solo de ese proyecto de prueba.
- Riesgo 2: restore destructivo. Cambio exigido: confirmación explícita; `mongorestore` excluye `admin.*` y
  `config.*` para no pisar usuarios.
- Riesgo 3: un backup fallido no debe dejar un archivo con nombre válido ni disparar la rotación. Cambio exigido:
  `set -euo pipefail`, temporal + `mv`, rotación solo tras éxito.
- Riesgo 4: credenciales. Se usan las variables de entorno del propio contenedor (`sh -c` dentro de `exec`), no
  se exportan desde el host ni quedan en el crontab; respaldos con permisos `600`.
- Arquitectura de software / solución: APROBADO ambos (reversible borrando dos scripts).

VEREDICTO: APROBADO CON CAMBIOS
