#!/bin/bash
# Ejecuta las migraciones SQL en orden numerado.
# PostgreSQL corre este script desde docker-entrypoint-initdb.d/ en el primer arranque.
set -e
for f in $(ls /docker-entrypoint-initdb.d/migrations/*.sql | sort); do
    echo "[init-db] Aplicando $f ..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done
echo "[init-db] Migraciones completadas."
