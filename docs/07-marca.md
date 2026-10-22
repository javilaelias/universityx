# Marca configurable (white-label)

La marca de la plataforma (nombre, logo, favicon, color y pie) sale del bloque `BRAND_*` del `.env`
raíz. Se lee al arrancar cada contenedor: para cambiarla basta editar el `.env` y
`docker compose up -d` (sin rebuild). Vacío o inválido = marca por defecto (Universidad X, verde).

## Variables

- `BRAND_NAME` — nombre visible (web, título, PWA, emails; por defecto también `ISSUER_NAME` y el remitente de `SMTP_FROM`).
- `BRAND_SHORT_NAME` — nombre corto de la PWA (máx. 12; vacío = `BRAND_NAME` recortado).
- `BRAND_TAGLINE` — subtítulo del certificado PDF y de `/verify`.
- `BRAND_PRIMARY_COLOR` — `#rrggbb`. Es el tono 600; la web deriva la escala 50–900 (tokens `brand-*`),
  y se usa en el `theme-color`, el manifest, el certificado y los enlaces de los emails.
- `BRAND_LOGO_URL` — logo de la web y de los emails. Ruta propia (`/brand/logo.png`) o `https://…`;
  en emails solo se usa si es `https://`.
- `BRAND_FAVICON_URL` — favicon (`.ico`, `.png` o `.svg`).
- `BRAND_ICON_URL` — PNG cuadrado de 512 px: íconos de la PWA y apple-touch.
- `BRAND_FOOTER_TEXT` — pie de login/registro y de los emails (vacío = `<nombre> © <año>` / el nombre)
  y franja inferior del certificado (vacío = `ISSUER_NAME`).
- `BRAND_LOGO_PATH` — PNG/JPEG **dentro del contenedor de credentials** para el logo del certificado.

## Archivos de la marca

Con `https://` no hace falta nada más. Para servir archivos propios, montalos con un
`docker-compose.override.yml` (no se commitea por academia):

```yaml
services:
  web:
    volumes: ["./brand:/app/public/brand:ro"]          # → BRAND_LOGO_URL=/brand/logo.png
  credentials-service:
    volumes: ["./brand:/brand:ro"]                     # → BRAND_LOGO_PATH=/brand/logo.png
```

## Alcance

Web (todas las pantallas por los tokens `brand-*`), emails de notification-service, certificado PDF,
manifest PWA. No cubre la app Android ni los tokens de fondo (`--bg`, `--surface`), que siguen fijos.
