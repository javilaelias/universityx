# Propuesta — respaldos-pg-mongo

## Por qué
Ítem 3 de la cola v1.0: el piloto necesita respaldos reales. Hoy la guía (`docs/06-despliegue.md` §7) solo
trae dos comandos sueltos, sin rotación, sin restauración probada y sin programación.

## Qué cambia
- `scripts/backup.sh`: `pg_dump -Fc` + `mongodump --archive --gzip` vía `docker compose exec -T`, con las
  credenciales que ya tiene cada contenedor (no lee ni expone el `.env` en el host); archivos con fecha en
  `BACKUP_DIR` (default `./backups`, `umask 077`), escritura atómica (temporal → `mv`) y rotación de
  `BACKUP_RETENTION_DAYS` días (default 7).
- `scripts/restore.sh <sello>`: `pg_restore --clean --if-exists` + `mongorestore --drop` (sin tocar `admin`/`config`),
  con confirmación explícita (`--yes` o escribir RESTAURAR).
- Respeta `COMPOSE_FILE`/`COMPOSE_PROJECT_NAME` nativos de Compose (staging = base + override).
- `docs/06-despliegue.md` §7: uso, cron diario, restauración, copia fuera del VPS. `.gitignore`: `backups/`.
- Prueba backup → restore en local con una pila descartable (no la BD de trabajo ni los volúmenes `ux_*`).

## Veredicto de integración
No es app nueva: scripts operativos del mismo repo.

## Reutilización
Herramientas oficiales de cada motor (`pg_dump`/`pg_restore`, `mongodump`/`mongorestore`) ya incluidas en las
imágenes `postgres:16-alpine` y `mongo:7-jammy`; cron del sistema. Sin dependencias nuevas.

## Fuera de alcance
Respaldo del volumen `ux_media_data` (videos: se documenta la pauta) y subida automática a almacenamiento remoto.
