# Tareas — endurecer-auth

## auth-service
- [x] 1. `services/password-policy.ts` + aplicarla en `registerSchema` (con regla de parte local del email) y `resetPasswordSchema`.
- [x] 2. Bloqueo por email en Redis (`recordLoginFailure`, `isLoginLocked`, `clearLoginFailures`); integrarlo en `login` y limpiar en `resetPassword` con `RETURNING u.email` (C3).
- [x] 3. JWT: HS256 fijo al firmar/verificar; `RT_TTL` desde `JWT_REFRESH_EXPIRES_IN`; `env.ts` production exige `JWT_REFRESH_SECRET` distinto y `ALLOWED_ORIGINS` sin `*`.
- [x] 4. Tests Vitest: política (corta, sin dígito, común, contiene email), bloqueo (5 fallos → 429, bloqueado no llama a BD, mismo 429 con email inexistente, login OK limpia), token HS512 con el mismo secreto rechazado, env production con refresh = access rechazado (C6); los existentes en verde.

## web
- [x] 5. `lib/auth.ts`: reenviar IP del cliente en login; `accessTokenExpires`; refresh solo con `trigger === 'update'`, error solo ante 401 de `/auth/refresh` (C2); `error` en sesión; quitar `refreshToken` de la sesión; secreto sin fallback en production; `ACCOUNT_LOCKED` → error `locked`. `/api/register` reenvía IP. Tipos en `next-auth.d.ts`.
- [x] 6. `SessionKeeper` en `Providers`: update antes de vencer / al foco, serializado con Web Locks y relectura de la sesión dentro del lock (C1); signOut solo si `error` (C2).
- [x] 7. Registro y reset: validación cliente de la política con claves i18n ES/EN (registro pasa a `t()`); reset distingue 400 de política (`fields`) de token inválido. Login muestra `login.locked` (esperar 15 min o restablecer, C4); un 400 con `fields` en reset es de política (C5).
- [x] 8. `next.config.mjs`: headers de seguridad + `poweredByHeader: false`.

## Docs
- [x] 9. `docs/06-despliegue.md`: política, bloqueo, renovación de sesión, cookies Secure con https, headers; ESTADO: hallazgo del `authLimiter` cerrado y algoritmo sin pinear en los otros servicios.

## Cierre
Puerta de salida: `/code-review high`: 10 hallazgos. Se corrigieron 9: carrera GET/POST de la cookie al rotar (refetchOnWindowFocus off + getSession sin broadcast dentro del Web Lock), 400 de token leído como política en reset y en registro (`failedPassword`), reset sin la regla del email, bloqueo check-then-act (INCR antes de bcrypt), update() cada 30 s sin expiry, `\p{L}` distinto en la web, duraciones no parseables (env exige `<n>[smhd]`) y limpieza post-commit sin catch. Se descartó 1: la lista COMMON duplicada entre web y server (builds separados; el server decide). Al implementar, `/auth/refresh` quedó sin `authLimiter`, que sería un bucket global tras Next. `/security-review`: sin hallazgos ≥8. QA juvinqa: APROBADO, con auth 45/45, tsc ×2 y `next build` OK. UI: Nivel 2 estático de login, registro y reset (claves ES/EN completas, el registro pasó a `t()`, clases `dark:` intactas). Queda pendiente el smoke en navegador real ES/EN + tema (headless).
