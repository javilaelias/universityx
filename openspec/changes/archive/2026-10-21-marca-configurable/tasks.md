# Tareas — marca configurable

- [x] 1. web: `lib/brand.ts` (lectura/validación + `brandPalette`), `BrandProvider`/`useBrand`, `BrandLogo`.
- [x] 2. web: Tailwind `brand-*` a variables CSS + defaults en `globals.css`; layout (metadata, viewport, favicon, `<style>` solo si hay color), `manifest.ts` con `dynamic = 'force-dynamic'`.
- [x] 3. web: Navbar, login, registro, forgot/reset, verify, tickets sin nombre fijo; i18n ES/EN de los textos tocados.
- [x] 4. notification-service: config de marca, envoltura de email (logo, color, pie) y nombre en asuntos; tests (default, custom, logo no https descartado).
- [x] 5. credentials-service: config de marca y PDF con nombre, tagline, colores, pie y logo opcional; tests (defaults, color inválido, logo inexistente).
- [x] 6. compose dev y staging (`BRAND_*` a web, notification, credentials; `ISSUER_NAME` y `SMTP_FROM` caen a `BRAND_NAME`), `.env.example`, `docs/07-marca.md`.
- [x] 7. ESTADO: hallazgo «Android sin marca configurable».
- [x] 8. Verificación: Vitest notification y credentials, `tsc` de ambos, `next build` de la web.

## Cierre
Puerta de salida: `/code-review high` — 10 hallazgos, 6 corregidos (SMTP_FROM/ISSUER_NAME del compose dev pisaban el `.env` de cada servicio → fallback a BRAND_NAME en código; remitente sin entrecomillar → `mailFrom` con `{name,address}`; `/\host` aceptado como ruta propia; nombre largo desbordaba el header del PDF → una línea achicada; logo del PDF leído por request → Buffer una vez), 4 descartados (todas las rutas dinámicas por `noStore`: requisito de leer la marca en runtime con imágenes del registro, decidido en concilio; regex `<a href=` en `wrap`: todos los enlaces salen de `link()`, con test; lectura de marca duplicada en 3 paquetes: no hay paquete compartido; themeColor oscuro y verde semántico de "verificado" fuera de alcance). `/security-review` no aplica (sin auth, secretos, API expuesta ni subida de archivos). QA juvinqa APROBADO: notification 23/23, credentials 11/11, `tsc` en 3 paquetes, `next build` OK. UI: smoke por HTML con `next start` (login, registro, verify, manifest) con marca custom (título, `--brand-600`, pie, manifest #aa3300) y sin BRAND_* (sin `<style>`, manifest actual); ES/EN y tema por revisión estática (sin navegador ni Docker).
