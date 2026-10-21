#!/usr/bin/env bash
# =============================================================================
# Restauración de un respaldo de scripts/backup.sh — ver docs/06-despliegue.md §7
# Uso:  scripts/restore.sh <sello> [--yes]     p. ej. scripts/restore.sh 2026-10-21_030000
#   Toma BACKUP_DIR/ux-pg-<sello>.dump y BACKUP_DIR/ux-mongo-<sello>.archive.gz.
#   DESTRUCTIVO: reemplaza las tablas y colecciones respaldadas. Las bases
#   admin y config de MongoDB (usuarios) no se tocan.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP="${1:-}"
[ -n "$STAMP" ] || { echo "Uso: $0 <sello> [--yes]" >&2; ls -1 "${BACKUP_DIR:-$PWD/backups}" 2>/dev/null | tail -6 >&2; exit 1; }
BACKUP_DIR="${BACKUP_DIR:-$PWD/backups}"
PG_FILE="$BACKUP_DIR/ux-pg-$STAMP.dump"
MONGO_FILE="$BACKUP_DIR/ux-mongo-$STAMP.archive.gz"
for f in "$PG_FILE" "$MONGO_FILE"; do
  [ -s "$f" ] || { echo "No existe o está vacío: $f" >&2; exit 1; }
done

if [ "${2:-}" != "--yes" ]; then
  echo "Se van a REEMPLAZAR los datos de PostgreSQL y MongoDB con el respaldo $STAMP."
  read -r -p "Escribí RESTAURAR para seguir: " answer
  [ "$answer" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }
fi

echo "[restore] PostgreSQL ← $PG_FILE"
docker compose exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction' < "$PG_FILE"

echo "[restore] MongoDB ← $MONGO_FILE"
docker compose exec -T mongodb sh -c \
  'mongorestore --quiet --archive --gzip --drop --nsExclude "admin.*" --nsExclude "config.*" -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' < "$MONGO_FILE"

echo "[restore] OK $STAMP"
