#!/usr/bin/env bash
# CERO.sh — Universidad X | arranque completo (equivalente POSIX de CERO.ps1)
#
# Uso:
#   ./CERO.sh            arranque normal (docker compose up -d --build + espera de BD)
#   ./CERO.sh --status   estado de los contenedores
#   ./CERO.sh --logs     logs en vivo
#   ./CERO.sh --stop     detiene los servicios (conserva datos)
#   ./CERO.sh --reset    borra contenedores Y VOLÚMENES (pide escribir RESET)
#
# Gotchas conocidos:
#   - infra/init-db.sh debe estar en LF (.gitattributes lo fuerza); un clon viejo en CRLF no aplica
#     las migraciones: re-checkout del archivo.
#   - Las migraciones (infra/migrations) solo corren con el volumen de Postgres vacío. En una BD
#     existente, aplicar las nuevas a mano (ver docs/07-notas-v1.0.md).
#   - El puerto de Postgres sale de POSTGRES_PORT del .env (default 5432).
set -euo pipefail
cd "$(dirname "$0")"

ok()   { printf '  [OK] %s\n' "$*"; }
warn() { printf '  [!]  %s\n' "$*"; }
err()  { printf '  [X]  %s\n' "$*" >&2; }

case "${1:-}" in
  --status) docker compose ps; exit 0 ;;
  --logs)   docker compose logs --tail=50 --follow; exit 0 ;;
  --stop)   docker compose down; ok "Servicios detenidos."; exit 0 ;;
  --reset)
    warn "Se eliminarán TODOS los datos de las bases de datos."
    read -r -p "  Escribe RESET para confirmar: " confirm
    [ "$confirm" = "RESET" ] || { echo "  Cancelado."; exit 0; }
    docker compose down -v --remove-orphans
    ok "Reset completo. Ejecuta ./CERO.sh para arrancar de cero."
    exit 0 ;;
  "") ;;
  *) err "Opción desconocida: $1"; exit 2 ;;
esac

echo "1/4  Prerrequisitos"
command -v docker >/dev/null || { err "Docker no encontrado."; exit 1; }
docker info >/dev/null 2>&1 || { err "El daemon de Docker no está corriendo."; exit 1; }
ok "Docker $(docker --version | awk '{print $3}' | tr -d ,)"
command -v node >/dev/null && ok "Node $(node --version)" || warn "Node.js no encontrado (solo afecta al dev local de la web)."
if [ -f .env ]; then ok ".env presente"; else warn ".env no encontrado: se usan los defaults de docker-compose.yml (cp .env.example .env)"; fi

echo "2/4  Infraestructura Docker"
docker compose up -d --build

echo "3/4  Esperando PostgreSQL"
waited=0
until [ "$(docker inspect --format='{{.State.Health.Status}}' ux_postgres 2>/dev/null)" = "healthy" ]; do
  sleep 3; waited=$((waited + 3))
  [ "$waited" -ge 90 ] && { err "PostgreSQL no respondió en 90 s (docker logs ux_postgres)."; exit 1; }
done
ok "PostgreSQL saludable (${waited}s)"

echo "4/4  Dependencias de la web (dev local)"
if [ -f web/package.json ] && [ ! -d web/node_modules ] && command -v npm >/dev/null; then
  (cd web && npm install --silent) && ok "npm install de web/"
else
  ok "Sin cambios"
fi

pgport=$(grep -E '^POSTGRES_PORT=' .env 2>/dev/null | cut -d= -f2 || true)
webport=$(grep -E '^WEB_PORT=' .env 2>/dev/null | cut -d= -f2 || true)
echo
echo "  Web         → http://localhost:${webport:-3300}"
echo "  PostgreSQL  → localhost:${pgport:-5432}"
echo "  pgAdmin     → http://localhost:5050   ·   Mongo-Express → http://localhost:8082"
