# Marca configurable (white-label)

## Por qué
v1.0 "Piloto vendible": una academia tiene que poder usar la plataforma con su marca sin tocar código.
Hoy "Universidad X", el verde y los íconos están fijos en web, emails, certificado PDF y manifest PWA.

## Qué cambia
- Bloque `BRAND_*` en el `.env` raíz (el "archivo de marca"), leído **en runtime** (la imagen de
  staging viene del registro: no puede depender del build):
  `BRAND_NAME`, `BRAND_SHORT_NAME`, `BRAND_TAGLINE`, `BRAND_PRIMARY_COLOR` (hex), `BRAND_LOGO_URL`,
  `BRAND_FAVICON_URL`, `BRAND_ICON_URL` (PNG ≥512 para PWA), `BRAND_FOOTER_TEXT`; y para el PDF
  `BRAND_LOGO_PATH` (PNG/JPEG local en el contenedor de credentials).
- Vacío o inválido = marca actual (nombre "Universidad X", paleta verde exacta, íconos de `public/`).
- **Web:** `lib/brand.ts` (servidor) + `BrandProvider`/`useBrand` (cliente); paleta `brand-*` de
  Tailwind pasa a variables CSS (`rgb(var(--brand-600) / <alpha-value>)`), el layout inyecta la escala
  derivada del color primario; metadata, viewport `themeColor`, favicon y manifest desde la marca;
  Navbar, login, registro, recuperar/restablecer, `/verify/[id]` y tickets sin nombre fijo.
- **Emails (notification-service):** asuntos/cuerpos con el nombre de la marca; envoltura con logo
  opcional, color primario en enlaces y pie (`BRAND_FOOTER_TEXT` o el nombre).
- **Certificado PDF (credentials-service):** nombre (`ISSUER_NAME`, que en compose cae a `BRAND_NAME`),
  tagline, colores derivados del primario, pie y logo opcional.
- Compose dev y staging pasan `BRAND_*` a web, notification y credentials; `.env.example` y
  `docs/07-marca.md` documentan el bloque.

## Veredicto de integración
Es un módulo de configuración dentro de UniversidadX (misma app, mismo despliegue); no hay app nueva.

## Reutilización
Sin dependencias nuevas: Tailwind (variables CSS con `<alpha-value>`), metadata/manifest de Next 14,
pdfkit (`doc.image`) y `escapeHtml`/`safeUrl` ya existentes en las plantillas.

## Fuera de alcance
Android (marca nativa), subir el logo desde el panel admin, multi-tenant (varias marcas en un despliegue),
tokens `--bg/--surface` (siguen fijos), fuente.
