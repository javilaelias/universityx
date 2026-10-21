# Concilio — despliegue-vps-staging

Profundidad: 2 (mecánico: documentación + override de compose con el patrón `!reset` ya usado; sin código
de servicios ni contrato de API). Lente condicional de seguridad activada (secretos).

## Reutilización — APROBADO
- Se extiende `docker-compose.staging.yml` existente (mismo patrón `!reset`, imágenes GHCR del `cd.yml`) en vez de
  un compose nuevo. Variables tomadas de `docker-compose.yml` y de los `src/config/env.ts` (fuente de verdad);
  sin librerías nuevas.

## Riesgo/QA (+ seguridad) — APROBADO CON CAMBIOS
- Riesgo 1: `env_file: !reset []` deja servicios sin variables que hoy vienen de `services/*/.env`. Mitigación:
  todo lo obligatorio de cada `env.ts` se inyecta en el override (JWT_SECRET, DATABASE_URL, REDIS_URL, MONGO_URL);
  el resto tiene default en el esquema.
- Riesgo 2: `auth-service` valida `JWT_REFRESH_SECRET` con `min(32)` si viene definida: no inyectarla vacía → requerida.
- Riesgo 3: la seed `004-seed-data.sql` corre en un volumen nuevo y crea usuarios de prueba con contraseña conocida.
  Cambio exigido: la guía obliga a cambiarlos/borrarlos antes de abrir el acceso.
- Riesgo 4: el rollback del deploy no debe usar `down -v`. Cambio exigido: la guía lo advierte.
- Arquitectura de software / solución: APROBADO ambos (sin cambio de stack; override reversible con `git revert`).
- Validación exigida: `docker compose config` con y sin secretos (tarea 4).

VEREDICTO: APROBADO CON CAMBIOS
