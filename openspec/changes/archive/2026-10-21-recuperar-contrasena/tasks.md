# Tareas — recuperar-contrasena

Cambios del concilio (C1–C8) ya incorporados.

## Backend
- [x] 1. Migración `infra/migrations/008-password-reset.sql` (tabla + índice, idempotente).
- [x] 2. auth-service: `NOTIFICATION_SERVICE_URL` en `config/env.ts`; `WEB_BASE_URL` obligatoria en production, default `http://localhost:3000` en dev (C5); cableado en `docker-compose.yml` y `docker-compose.staging.yml`.
- [x] 3. auth-service: `services/reset-token.service.ts` (token 32 bytes base64url, sha256) y `controllers/password-reset.controller.ts` con `forgotPassword` / `resetPassword` + schemas zod. Token solo para usuario activo con `password_hash` local (C4); reset con `UPDATE` de `user_credentials`; locale = `users.language` si es es/en, si no el de la petición; enlace solo con `WEB_BASE_URL` (C5).
- [x] 4. auth-service: límite por email en Redis (`INCR`+`EXPIRE`, 3/h) y `passwordLimiter` propio en ambas rutas (C3).
- [x] 5. notification-service: evento `auth.password_reset` ES/EN (enlace con `safeUrl`); eventos solo-email sin in-app; encolado sin retención (`removeOnComplete/removeOnFail: true`, C1); en consola + production, `resetUrl` redactado en el log (C2).
- [x] 6. Tests Vitest: forgot (genérico con email existente/inexistente/inactivo/sin credencial local, límite por email), reset (ok + revoca sesiones, token inválido → 400, carrera de dos resets → 200/400, password corta → 400), plantillas ES/EN, worker: solo-email sin in-app y eventos existentes con in-app, job sin retención, redacción en consola prod (C8).

## Web
- [x] 7. Rutas proxy `web/src/app/api/password/forgot` y `.../reset`: 415 si no es JSON, campos en lista blanca (C7).
- [x] 8. Páginas `(auth)/forgot-password` y `(auth)/reset-password` (`referrer: no-referrer`, token fuera de la URL con `history.replaceState`, C6); enlace en login; aviso `reset=1` que menciona el cierre de sesiones; claves i18n ES/EN.

## Docs
- [x] 9. `docs/06-despliegue.md`: aplicar la migración 008 en una BD existente; nota de correo perdido si notification cae y de access JWT vigentes hasta 15 min. `.env.example` si hace falta. Deuda del `authLimiter` compartido tras el proxy → ESTADO.

## Cierre
Puerta de salida: `/code-review high` — 10 hallazgos, 10 corregidos (token descartado ante 429/5xx, limitador con IP del contenedor web, locale ignorado, tercero anulaba el enlace de la víctima, fallo de notification mataba el enlace previo, bcrypt antes de validar token, INCR/EXPIRE no atómico, proxy sin 502, phishing vía `/trigger` con `resetUrl` arbitrario, placeholder sin i18n), 0 descartados. `/security-review`: sin hallazgos ≥8 (fuera por exclusión: XFF solo afecta rate limit; access JWT vigente hasta 15 min, documentado). QA juvinqa APROBADO: auth 23 y notification 19 tests verdes, tsc ×3 y `next build` OK. UI: Nivel 2 estático de `/forgot-password`, `/reset-password` y `/login` (claves ES/EN completas por tipo, clases `dark:` como login); smoke en navegador real ES/EN + tema queda pendiente (sin contenedores).
