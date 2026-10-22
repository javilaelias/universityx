#!/usr/bin/env bash
# Genera los .env de servicios para la E2E en CI con valores descartables (nada sale de secrets).
# DATABASE_URL / REDIS_URL / MONGO_URL los fija docker-compose.yml; aquí va el resto.
set -euo pipefail
cd "$(dirname "$0")/.."

JWT_SECRET="e2e-$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="e2e-$(openssl rand -hex 32)"
ORIGINS="http://localhost:3000"

write() { # servicio puerto líneas extra...
  local svc=$1 port=$2; shift 2
  { echo "NODE_ENV=development"; echo "PORT=$port"; echo "JWT_SECRET=$JWT_SECRET"; printf '%s\n' "$@"; } \
    > "services/$svc/.env"
}

write auth-service         4001 "JWT_EXPIRES_IN=15m" "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" \
                                "JWT_REFRESH_EXPIRES_IN=7d" "ALLOWED_ORIGINS=$ORIGINS"
write lms-service          4002 "ALLOWED_ORIGINS=$ORIGINS" "CDN_BASE_URL=http://localhost:4008" "CACHE_TTL_SEC=60"
write notification-service 4003 "SMTP_HOST=console" "SMTP_FROM=e2e@localhost"
write helpdesk-service     4004 "NOTIFICATION_SERVICE_URL=http://ux_notification:4003"
write sync-service         4005
write ai-service           4006
write credentials-service  4007 "ISSUER_URL=http://localhost:3000"
write media-service        4008 "ALLOWED_ORIGINS=$ORIGINS" "MEDIA_STORAGE_PATH=/data/media" \
                                "MEDIA_EXTERNAL_URL=http://localhost:4008" "MAX_UPLOAD_MB=50"
echo "[ci-env] .env de servicios generados"
