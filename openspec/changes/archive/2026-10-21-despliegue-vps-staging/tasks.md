# Tareas — despliegue-vps-staging

- [x] 1. `docker-compose.staging.yml`: `env_file: !reset []` en los 8 servicios; `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  contraseñas de BD/Redis y `NEXTAUTH_SECRET`/`NEXTAUTH_URL` con `${VAR:?}`; `NODE_ENV=production`;
  `ports: !reset []` en postgres/mongodb/redis; pgAdmin y Mongo Express con `profiles: [tools]`.
- [x] 2. `.env.example` completo y sin valores reales (agrega las variables que faltan).
- [x] 3. `docs/06-despliegue.md` con la guía VPS (incluye aviso de usuarios seed y del rollback).
- [x] 4. Validar: `docker compose -f docker-compose.yml -f docker-compose.staging.yml config` falla sin
  secretos y pasa con un env de prueba descartable; ningún `env_file`, ni puerto de BD, ni default de dev en la salida.
- [x] 5. Verificar secretos versionados: `git ls-files` sin `.env*` reales; `git log --all` sin `.env`; grep de patrones.
- [x] 6. README y ESTADO apuntan a la guía.

## Cierre

Puerta de salida: `/code-review low` — 0 hallazgos. `/security-review` — 0 vulnerabilidades nuevas (≥8/10); 2 notas
preexistentes: (a) web y microservicios publicados en 0.0.0.0, que Docker abre saltándose UFW → **corregido**: en
staging quedan en `127.0.0.1` detrás del proxy (guía actualizada); (b) pgAdmin/Mongo Express con `admin1234` por
defecto → descartado: solo con `--profile tools` y en 127.0.0.1; la guía exige definir sus contraseñas. Extra
corregido en la implementación: `media-service` faltaba en la matriz de `cd.yml` (su imagen GHCR no existía) y
el `maxmemory-policy` de Redis en staging se mantiene `noeviction` (BullMQ). Sin UI.
Validación: `docker compose ... config` falla sin secretos (`falta POSTGRES_USER`) y sin `JWT_REFRESH_SECRET`;
con un env de prueba pasa sin `env_file`, sin defaults de dev y sin puertos de BD.
QA juvinqa Nivel 1: APROBADO (config con/sin secretos, cobertura de .env.example, sin secretos versionados).
