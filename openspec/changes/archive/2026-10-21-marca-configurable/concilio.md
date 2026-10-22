VEREDICTO: APROBADO CON CAMBIOS
Profundidad: 5 — señal que la decidió: `[requiere concilio]`; dirección nueva (tokens de tema a variables CSS) y dato compartido (bloque `BRAND_*` que leen 3 paquetes).
Arq. software: CON CAMBIOS — lectura por paquete con defaults correcta (no hay paquete compartido y crear uno es más caro que 3 lectores chicos); precisar el render dinámico del manifest y que los defaults sean idénticos a la marca actual.
Arq. solución: OK — sin dependencias nuevas; runtime env es obligatorio porque staging usa imágenes del registro (un `NEXT_PUBLIC_*` de build no serviría); Tailwind 3.4 soporta `<alpha-value>` (usado en `bg-brand-900/30` y gradientes).
Revisores:
- Reutilización: OK — `escapeHtml`/`safeUrl` de las plantillas, `ISSUER_NAME` existente como nombre del emisor, metadata/manifest de Next, `doc.image` de pdfkit. Nada en el registro de la fábrica resuelve white-label de Next mejor que variables CSS.
- Producto/UX: OK — cubre los 4 destinos del ítem; el panel admin para subir logo queda fuera (operador configura por `.env`). Android fuera de alcance: anotarlo como hallazgo.
- Riesgo/QA: CON CAMBIOS — riesgo de regresión visual si la paleta default cambia; exigir defaults idénticos y tests.
- Simplicidad: OK — una sola variable de color genera la escala; nada de multi-tenant ni archivo JSON aparte (el `.env` raíz es el archivo de marca).
- Seguridad (lente condicional, entrada inyectada en HTML/CSS): OK con cambios 3 — valores solo del operador; `<style>` solo con números generados; URLs con lista blanca de esquema.
Cambios exigidos:
1. `manifest.ts` con `export const dynamic = 'force-dynamic'` (si no, se prerenderiza en el build con la marca default).
2. Compose: `SMTP_FROM` cae a `${BRAND_NAME:-Universidad X} <no-reply@universidadx.com>` e `ISSUER_NAME` a `BRAND_NAME` (interpolación anidada de Compose v2), para que cambiar solo `BRAND_NAME` alcance remitente y certificado.
3. Validación: color solo `#rrggbb`; URL `/ruta` (no `//`) o `https://`, en email solo `https://` y siempre con `escapeHtml`; textos sin saltos de línea y máx. 120.
4. Defaults: sin `BRAND_*` la web no inyecta `<style>` (rigen los RGB de `globals.css` = hex actuales), el PDF usa los hex actuales y los emails "Universidad X". Tests: notification (marca default y custom en asunto/pie/logo, logo no https descartado) y credentials (config de marca: defaults, color inválido, logo inexistente).
5. Anotar en ESTADO: Android sin marca configurable.
Mayor riesgo y mitigación: regresión visual de toda la web al mover `brand-*` a variables → defaults en triplete RGB idénticos a los hex actuales y `next build` + revisión de clases con opacidad (`/30`, `/10`).
Reutilizar del registro: nada del registro; del proyecto `escapeHtml`, `safeUrl`, `ISSUER_NAME`, `useLang`/`translate` para los textos nuevos.
