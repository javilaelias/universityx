VEREDICTO: APROBADO CON CAMBIOS
Profundidad: 5 — señal que la decidió: flujo de autenticación nuevo ([requiere concilio]) con token que da control de la cuenta, en dos servicios + web.
Arq. software: CON CAMBIOS — capas y uso único atómico bien; faltan limitador propio y no dar contraseña local a cuentas SSO.
Arq. solución: CON CAMBIOS — reparto auth/notification/proxy correcto sin dependencias nuevas; el token no puede quedar en Redis (BullMQ) ni en logs.
Cambios exigidos:
1. Encolar `auth.password_reset` con `removeOnComplete: true` y `removeOnFail: true` (sin retención del job con el token).
2. En modo consola con `NODE_ENV=production`, redactar `resetUrl` del log del worker (en dev puede mostrarse); test.
3. Limitador `passwordLimiter` propio (no compartir el contador de `authLimiter`: detrás del proxy Next la IP es la del contenedor web). Deuda del limitador compartido → ESTADO.
4. Emitir token solo si el usuario está activo y tiene `password_hash` local; en reset `UPDATE` (no upsert) de `user_credentials`.
5. Enlace solo desde `WEB_BASE_URL` (nunca Host/X-Forwarded-Host); obligatorio en production, default `http://localhost:3000` en dev.
6. `/reset-password`: `Referrer-Policy: no-referrer` y quitar el token de la URL con `history.replaceState`.
7. Rutas proxy: 415 si no es `application/json`; reenviar solo campos en lista blanca.
8. Tests extra: job sin retención, redacción en consola prod, usuario sin credencial → no envía, dos resets simultáneos → 200/400; eventos existentes siguen guardando in-app.
Mayor riesgo y mitigación: fuga del token válido fuera del correo (Redis de BullMQ, stdout del worker, Referer) → cambios 1, 2 y 6; en BD solo SHA-256.
Reutilizar del registro: `crypto` (stdlib), `express-rate-limit`, `getRedis()`, `revokeAllUserTokens`, `hashPassword`, `validate`+zod, `safeUrl`/`escapeHtml` y transporte de notification-service, patrón `notifyAsync` de helpdesk, páginas `(auth)` con i18n/tema.

## Arquitecto
Software: contrato y schemas siguen el patrón actual; transacción del reset correcta. Cambiar upsert por UPDATE (4) y limitador propio (3).
Solución: 008 es la siguiente migración; aplicación manual documentada es aceptable. `WEB_BASE_URL` obligatoria en producción (5).

## Reutilización
Sin dependencias nuevas. `revokeAllUserTokens` usa `KEYS`: aceptable a esta escala. Contador por email con `getRedis()`.

## Producto/UX
Mensaje genérico correcto. El aviso `reset=1` aclara que se cerraron las demás sesiones. Locale del correo: `users.language`, si no el de la petición.

## Riesgo/QA
Sumar los tests del cambio 8. Si notification-service está caído el correo se pierde (solo log): aceptable en piloto, documentar. Regresión del worker: eventos existentes siguen con in-app.

## Simplicidad
Alcance justo (sin CAPTCHA, Android ni runner de migraciones). 202 antes de tocar la BD es lo más simple para igualar timing. `INCR`/`EXPIRE` alcanza.

## Seguridad (OWASP + ofensiva)
Cubiertos: enumeración y timing (202 previo), fuerza bruta (256 bits), hash en BD, uso único y expiración, revocación de refresh (access JWT hasta 15 min: riesgo aceptado, documentar). Ataques: Redis/logs (1, 2), agotar limitador global (3), contraseña local en SSO (4), Host header (5; redirect final fijo, sin open redirect), Referer (6), CSRF proxy (7). `/notifications/trigger` sin auth es preexistente: verificar que 4003 no quede expuesto en staging.
