# Diseño — endurecer-auth

## Política (auth-service `src/services/password-policy.ts`)
`passwordSchema(emailField?)`: zod `string().min(10).max(128)` + `regex(/[A-Za-z]/)` + `regex(/\d/)` +
refine contra `COMMON` (≈30 entradas, comparación en minúsculas). La regla "no contiene la parte local
del email" va como `superRefine` en `registerSchema` (en reset no hay email; se omite). Mensajes en ES
(los muestra la web solo como respaldo: la web valida antes con sus claves i18n).

## Bloqueo (Redis, `db/redis.ts`)
- `loginfail:<sha256(email)>` contador con `SET NX EX 900` + `INCR` en `MULTI` (patrón de `countResetRequest`).
- `isLoginLocked(h)`: contador ≥ 5. Al llegar a 5 se renueva el TTL a 900 s (bloqueo 15 min desde el 5.º fallo).
- `clearLoginFailures(h)`: `DEL` tras login correcto y tras reset de contraseña.
- Login: si bloqueado → 429 `{ error, code: 'ACCOUNT_LOCKED' }` sin consultar BD ni bcrypt. Si falla la
  credencial → registrar fallo → 401 (o 429 si este fallo bloqueó). Cuenta desactivada no suma.
- Riesgo aceptado: un tercero puede bloquear 15 min una cuenta conociendo el email; el reset sigue
  disponible y lo limpia. El `authLimiter` por IP sigue frenando barridos.

## Refresh en la web
- `jwt` callback guarda `accessTokenExpires` (ms, de `expiresIn` del login/refresh).
- Solo con `trigger === 'update'` y token a < 2 min de vencer: `POST /auth/refresh`; éxito → nuevos tokens;
  fallo → `token.error = 'RefreshAccessTokenError'`. `getServerSession` en route handlers nunca rota (no
  puede persistir la cookie: rotar ahí revocaría el refresh guardado).
- `SessionKeeper` (cliente, en `Providers`): `setTimeout` hasta `accessTokenExpires - 60 s` → `update()`;
  también al volver el foco si ya venció. Si `session.error` → `signOut({ callbackUrl: '/login' })`.
- `session` expone `accessTokenExpires` y `error`; no `refreshToken`.

## Producción
`env.ts` refine: production exige `JWT_REFRESH_SECRET` ≠ `JWT_SECRET` y `ALLOWED_ORIGINS` sin `*`.
`jwt.service.ts`: `algorithm: 'HS256'` al firmar y `algorithms: ['HS256']` al verificar.
`redis.ts`: `RT_TTL_SECONDS` desde `JWT_REFRESH_EXPIRES_IN` (exportar `parseDurationToMs`).

## Cambios del concilio
- C1: `SessionKeeper` dentro de `navigator.locks.request('ux-session-refresh', …)` relee con `getSession()` y solo llama a `update()` si sigue a < 2 min de vencer.
- C2: en el callback, solo un 401 de `/auth/refresh` pone `error`; red/5xx devuelven el token sin cambios.
- C3: el `UPDATE user_credentials … RETURNING u.email` del reset alimenta `clearLoginFailures`.
- Implementación: `/auth/refresh` sin `authLimiter` (lo llama el servidor Next para todos: bucket global que cortaría las renovaciones; el refresh es un JWT firmado).
