# 06 — Despliegue en un VPS (staging / piloto)

Despliegue reproducible con `docker-compose.yml` + `docker-compose.staging.yml` e imágenes pre-construidas
en GHCR (las publica `.github/workflows/cd.yml` en cada push a `main`). Los secretos viven **solo** en el
`.env` del servidor: nunca en el repo, nunca en `services/*/.env` (esos son solo para desarrollo).

## Qué cambia el override de staging

- Sin `env_file` por servicio: todas las variables salen del `.env` raíz del VPS.
- Secretos obligatorios con `${VAR:?}`: si falta uno, `docker compose` falla **antes** de arrancar, en vez de
  usar las contraseñas de desarrollo que trae `docker-compose.yml`.
- `NODE_ENV=production` en los microservicios.
- PostgreSQL, MongoDB y Redis **no** publican puertos (solo red interna `ux_network`).
- La web (`3000`) y los microservicios (`4001`–`4008`) escuchan solo en `127.0.0.1`: se llega a ellos por el
  reverse proxy del mismo VPS. (Docker publica puertos saltándose UFW, así que el firewall solo no alcanza.)
- pgAdmin y Mongo Express no arrancan salvo con `--profile tools`, y solo escuchan en `127.0.0.1`.

## 1. Requisitos del VPS

- Linux x86_64 con 4 GB de RAM o más (media-service transcodifica con FFmpeg) y 40 GB de disco.
- Docker Engine con el plugin Compose v2.24+ (soporta `!reset`/`!override`).
- Dominio apuntando al VPS y un reverse proxy con TLS (Caddy, Nginx o Traefik) delante de la web
  (`3000`), auth (`4001`) y media (`4008`).
- Firewall: abrir solo `22`, `80` y `443`. El proxy publica la web, auth y media (y lo que la app Android
  consuma) hacia `127.0.0.1:<puerto>`.

## 2. Código y acceso a imágenes

```bash
sudo mkdir -p /opt/universidadx && sudo chown "$USER" /opt/universidadx
git clone <url-del-repo> /opt/universidadx && cd /opt/universidadx
# Si las imágenes de GHCR son privadas: token con permiso read:packages
echo "<token>" | docker login ghcr.io -u <usuario> --password-stdin
```

## 3. Variables de entorno (`.env`)

```bash
cp .env.example .env && chmod 600 .env
openssl rand -base64 48   # una vez por cada secreto
```

Completar en `.env`, con valores distintos entre sí:

- `POSTGRES_PASSWORD`, `MONGO_PASSWORD`, `REDIS_PASSWORD`.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET` (mínimo 32 caracteres).
- `NEXTAUTH_URL` (`https://<dominio>`), `AUTH_EXTERNAL_URL` y `MEDIA_EXTERNAL_URL` (URLs públicas vía proxy).
- `REGISTRY` (`ghcr.io/<owner>`) e `IMAGE_TAG` (`latest` o el SHA de un commit).
- Email real: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (con `SMTP_HOST=console` no se envía).
- Si se usan los paneles: `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, `ME_USER`, `ME_PASSWORD`.

Validar sin arrancar nada (debe terminar sin error):

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml config --quiet
```

## 4. Arranque

```bash
alias dcs='docker compose -f docker-compose.yml -f docker-compose.staging.yml'
dcs pull
dcs up -d --no-build
dcs ps            # todos "healthy"
```

En el primer arranque PostgreSQL ejecuta `infra/migrations/` (esquema + datos de prueba).

> **Antes de abrir el acceso:** las migraciones `004-seed-data.sql` y `005-mock-data.sql` crean usuarios de
> prueba (`admin@universidadx.com`, `instructor@universidadx.com`, alumnos de ejemplo) con contraseñas
> conocidas. Cambiarles la contraseña o desactivarlos (`is_active = false`) antes de dar la URL a la academia.

Paneles de administración (solo por túnel SSH): `dcs --profile tools up -d pgadmin mongo-express` y luego
`ssh -L 5050:127.0.0.1:5050 <vps>`.

## 5. Verificación

- `dcs ps` sin servicios `unhealthy`; `curl -fsS http://127.0.0.1:4001/health`.
- Abrir `https://<dominio>`, iniciar sesión y abrir un curso.
- `dcs logs --tail 50 notification-service` al disparar un email.

## 6. Actualizar y volver atrás

```bash
git pull
IMAGE_TAG=<sha-nuevo> dcs pull && IMAGE_TAG=<sha-nuevo> dcs up -d --no-build --remove-orphans
```

Rollback: el mismo comando con el `IMAGE_TAG` anterior (fijarlo en `.env` para que sobreviva reinicios).
**Nunca** `docker compose down -v`: borra los volúmenes (todos los datos). Las migraciones no se revierten
solas: respaldar antes de actualizar.

## 7. Respaldos y restauración

`scripts/backup.sh` respalda PostgreSQL (`pg_dump -Fc`) y MongoDB (`mongodump --archive --gzip`) en `backups/`
(ignorada por git, permisos `600`) y borra los de más de `BACKUP_RETENTION_DAYS` días (default 7). Usa las
credenciales de cada contenedor: el `.env` no se exporta ni queda en el crontab. Si falla un paso, sale con
código 1 y no rota; ese sello queda incompleto (sin el archivo de Mongo) y `restore.sh` lo rechaza.

```bash
export COMPOSE_FILE=docker-compose.yml:docker-compose.staging.yml   # en staging
scripts/backup.sh          # → backups/ux-pg-<sello>.dump + backups/ux-mongo-<sello>.archive.gz
```

Programarlo (diario a las 03:00, `crontab -e` del usuario que corre Docker):

```cron
0 3 * * * cd /opt/universidadx && COMPOSE_FILE=docker-compose.yml:docker-compose.staging.yml BACKUP_RETENTION_DAYS=14 scripts/backup.sh >> "$HOME/ux-backup.log" 2>&1
```

Restaurar (**destructivo**: reemplaza las tablas y colecciones respaldadas; lo creado después del respaldo y que
no estaba en él queda; los usuarios de `admin` de MongoDB no se tocan). Con la app sin tráfico:

```bash
scripts/restore.sh                         # lista los últimos respaldos
scripts/restore.sh 2026-10-21_030000       # pide escribir RESTAURAR (o agregar --yes)
dcs restart auth-service lms-service       # y el resto de servicios que tengan conexiones abiertas
```

Probado en local (2026-10-21) con una pila descartable: datos sembrados → backup → tablas y colecciones borradas →
restore → datos recuperados; restore repetido sin errores; rotación de un archivo de 10 días; backup con MongoDB
caído → código 1 sin archivo de Mongo ni rotación. **No** probar sobre `docker-compose.yml` con otro nombre de
proyecto: sus volúmenes tienen nombre fijo (`ux_postgres_data`…) y serían los de trabajo.

Fuera de los scripts: copiar `backups/` fuera del VPS (p. ej. `rclone copy` o `rsync` a otro host) y respaldar el
volumen de videos procesados `ux_media_data` (`docker run --rm -v ux_media_data:/d -v "$PWD/backups":/b alpine
tar czf /b/media-$(date +%F).tgz -C /d .`).

## 8. Checklist de secretos

- [ ] `.env` existe solo en el servidor, con `chmod 600`; `git status` no lo muestra (está en `.gitignore`).
- [ ] Ningún secreto con el valor de `.env.example` (`CHANGE_ME…`) ni con los defaults de desarrollo.
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET` y `NEXTAUTH_SECRET` distintos y de 32+ caracteres.
- [ ] Usuarios de prueba de la seed cambiados o desactivados.
- [ ] Bases de datos sin puertos publicados y servicios solo en `127.0.0.1` (`dcs ps`: ningún `0.0.0.0`).

## Nota sobre el CD

`cd.yml` arma un `.env.staging` en el runner de GitHub pero no lo copia al servidor: en el VPS manda el
`.env` de `/opt/universidadx`. El paso de deploy corre `git reset --hard origin/main`, que no toca el `.env`
porque está ignorado.
