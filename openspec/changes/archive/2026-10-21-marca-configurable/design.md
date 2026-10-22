# Diseño — marca configurable

## Lectura y validación (igual en los 3 paquetes, sin paquete compartido: no existe uno)
- Vacío → default. `BRAND_PRIMARY_COLOR` solo `#rrggbb` (si no, default + warn).
- URLs (`LOGO/FAVICON/ICON`): ruta propia `/x` (no `//`) o `https://…`; otra cosa → default. En HTML
  de emails solo `https://` (un `/x` relativo no sirve en un correo).
- Texto: recortado, sin saltos de línea, máx. 120 caracteres; en HTML siempre con `escapeHtml`.
- `BRAND_LOGO_PATH` (PDF): archivo existente con extensión png/jpg/jpeg; si falla `doc.image`, se omite.

## Web
- `src/lib/brand.ts`: `getBrand()` lee `process.env` y llama `unstable_noStore()` → layout y manifest se
  renderizan por request (la marca cambia con reiniciar el contenedor, sin rebuild).
- `brandPalette(hex)`: 600 = primario; 50–500 mezclan con blanco (95/90/75/60/30/15 %), 700–900 con negro
  (15/30/45 %). Sin `BRAND_PRIMARY_COLOR` no se inyecta nada: rigen los defaults de `globals.css`
  (los hex actuales en triplete RGB).
- `layout.tsx`: `generateMetadata`/`generateViewport` desde la marca; `<style>` con `:root{--brand-*}`
  (solo números generados, sin texto del usuario); `<link rel=icon>` y apple-touch desde la marca;
  `<BrandProvider brand={publicBrand}>` dentro de `Providers`.
- `manifest.ts`: name/short_name/theme_color/icons desde la marca.
- `BrandLogo` componente: `<img>` si hay `logoUrl`, si no el ícono `BookOpen` actual.
- `verify/[id]` pasa de `green-*` a `brand-*`.

## Emails
- `src/config/brand.ts` + `wrapEmail(html)` en `email.templates.ts`: logo (si https), cuerpo, pie gris.
  `{brand}` en asuntos de reset y genéricos.

## PDF
- `certificate-pdf.ts` recibe `brand` (tagline, colores 50/200/600/900, footer, logoPath) con defaults
  = hex actuales.
