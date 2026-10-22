# Endurecer auth para datos reales

## Por qué
v1.0 "Piloto vendible" pone datos reales de una academia. Hoy: contraseña de 8 caracteres sin más regla,
sin bloqueo por intentos (solo un rate limit por IP que, tras el proxy de la web, es un bucket global),
el access JWT de 15 min no se renueva en la web (la sesión de NextAuth dura 8 h/30 d pero las llamadas a
los servicios dan 401 a los 15 min), el refresh token viaja al navegador en `/api/auth/session`, el
secreto de NextAuth y el de refresh tienen fallback fijo, y la web no manda headers de seguridad.

## Qué cambia
- **Política de contraseñas** (auth-service, un solo módulo): 10–128 caracteres, al menos una letra y un
  dígito, no está en una lista corta de contraseñas comunes y no contiene la parte local del email.
  Se aplica en `register` y `reset-password`. Las contraseñas existentes siguen sirviendo para entrar.
  La web valida lo mismo antes de enviar (registro y reset) con mensajes i18n ES/EN.
- **Bloqueo temporal**: 5 fallos de login para un email en 15 min → bloqueo de 15 min (429 con mensaje
  genérico). Cuenta por email exista o no (no revela cuentas). Un login correcto limpia el contador; un
  reset de contraseña también. La web muestra "cuenta bloqueada temporalmente" (i18n).
- **IP real tras el proxy**: NextAuth `authorize` y `/api/register` reenvían la IP del cliente (mismo
  criterio que `api/password/proxy.ts`), cerrando el hallazgo del `authLimiter` como bucket global.
- **JWT y refresh**: `verify` con `algorithms: ['HS256']`; `JWT_REFRESH_SECRET` obligatorio y distinto de
  `JWT_SECRET` en production; TTL de la clave Redis del refresh = `JWT_REFRESH_EXPIRES_IN` (hoy 7 d fijo).
  En la web, el access token se renueva con `/auth/refresh` (rotación ya existente) solo vía
  `update()` de la sesión (respuesta que persiste la cookie), disparado por un componente cliente antes
  de que venza; si falla, se cierra la sesión. `refreshToken` deja de exponerse en la sesión del cliente.
- **Cookies/CORS**: `NEXTAUTH_SECRET` sin fallback en production (NextAuth falla cerrado); cookies
  `Secure`/`__Secure-` las pone NextAuth cuando `NEXTAUTH_URL` es https (se documenta); CORS de
  auth-service: en production rechaza `*` en `ALLOWED_ORIGINS`.
- **Headers web** (`next.config.mjs`): `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS en production,
  CSP mínima sin romper Next (`frame-ancestors 'none'; base-uri 'self'; object-src 'none'`),
  `poweredByHeader: false`.

## Fuera de alcance
CSP con nonces; detección de reutilización de refresh token (con renovaciones concurrentes daría falsos
positivos); pinear algoritmo en los otros 6 servicios (anotado en ESTADO); MFA.

## Veredicto de integración
Todo dentro de auth-service y web existentes; sin servicios ni dependencias nuevas (zod, Redis,
express-rate-limit, helmet, next-auth ya instalados).
