# Propuesta — despliegue-vps-staging

## Por qué
Ítem 2 de la cola v1.0: no hay guía de despliegue y hoy un VPS no se levanta sin pasos ocultos.
- `docker-compose.yml` exige `services/*/.env` (no versionados, sin ejemplo) y es la única fuente de
  `JWT_SECRET`; un clon limpio en un VPS no arranca.
- El compose base trae contraseñas de desarrollo por defecto (`ux_dev_pass_2024`, `admin1234`, secreto
  NextAuth de dev): si una variable falta en el VPS, arranca con un secreto público.
- Postgres/Mongo/Redis y pgAdmin/Mongo Express publican puertos.
- `.env.example` no lista ~15 variables que el compose sí usa.

## Qué cambia
- `docker-compose.staging.yml`: sin `env_file` por servicio; secretos solo desde variables de entorno
  (`.env` raíz del VPS) con `${VAR:?}` → `docker compose config` falla si falta un secreto; `NODE_ENV=production`;
  bases de datos sin puertos publicados; pgAdmin y Mongo Express detrás del perfil `tools`.
- `.env.example`: completo (todas las variables del compose base + staging), sin valores reales.
- `docs/06-despliegue.md`: guía VPS paso a paso (requisitos, `.env`, generar secretos, arranque, verificación,
  actualización, rollback, respaldo, checklist de secretos).
- Verificación de que ningún secreto real está versionado (árbol + historial de `.env`).

## Veredicto de integración
No es app nueva: documentación y override de despliegue del mismo repo.

## Reutilización
Se reutiliza el override existente (`!reset`, imágenes GHCR del `cd.yml`); sin dependencias nuevas.

## Fuera de alcance
Corregir `cd.yml` (escribe `.env.staging` en el runner y no lo copia al servidor) — se anota como hallazgo.
Reverse proxy/TLS concreto: la guía da la pauta, no se agrega servicio.
