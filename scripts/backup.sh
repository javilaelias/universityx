#!/usr/bin/env bash
# =============================================================================
# Respaldo de PostgreSQL + MongoDB con rotación — ver docs/06-despliegue.md §7
# Uso (desde cualquier carpeta):  scripts/backup.sh
#   BACKUP_DIR              carpeta de destino            (default: <repo>/backups)
#   BACKUP_RETENTION_DAYS   días que se conservan         (default: 7)
#   COMPOSE_FILE / COMPOSE_PROJECT_NAME  las nativas de Compose (staging:
#     COMPOSE_FILE=docker-compose.yml:docker-compose.staging.yml)
# Las credenciales salen de las variables del propio contenedor: nada del .env
# pasa por el host ni por el crontab.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-$PWD/backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-7}"
case "$RETENTION" in ''|*[!0-9]*) echo "BACKUP_RETENTION_DAYS debe ser un entero" >&2; exit 1 ;; esac
STAMP="$(date +%Y-%m-%d_%H%M%S)"
PG_FILE="$BACKUP_DIR/ux-pg-$STAMP.dump"
MONGO_FILE="$BACKUP_DIR/ux-mongo-$STAMP.archive.gz"

umask 077
mkdir -p "$BACKUP_DIR"
trap 'rm -f "$PG_FILE.tmp" "$MONGO_FILE.tmp"' EXIT

echo "[backup] PostgreSQL → $PG_FILE"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$PG_FILE.tmp"
mv "$PG_FILE.tmp" "$PG_FILE"

echo "[backup] MongoDB → $MONGO_FILE"
docker compose exec -T mongodb sh -c 'mongodump --quiet --archive --gzip -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' > "$MONGO_FILE.tmp"
mv "$MONGO_FILE.tmp" "$MONGO_FILE"

# Rotación solo tras un respaldo completo.
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'ux-pg-*.dump' -o -name 'ux-mongo-*.archive.gz' \) \
  -mtime +"$RETENTION" -print -delete | sed 's/^/[backup] rotado: /'

echo "[backup] OK $STAMP"
