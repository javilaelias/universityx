# Diseño — recuperar-contrasena

## Tabla
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL UNIQUE,      -- sha256 hex del token; el token en claro nunca se guarda
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
```
SHA-256 (no bcrypt) porque el token tiene 256 bits de entropía: no es adivinable y permite buscar
por igualdad. Idempotente; en una BD ya creada se aplica a mano (`psql -f`), documentado en
`docs/06-despliegue.md`.

## Flujo forgot
1. Responder `202` con mensaje genérico **antes** de tocar la BD.
2. En segundo plano (`void requestReset(...).catch(log)`): `INCR pwreset:<sha256(email)>` con TTL
   1 h; si > 3, cortar. Buscar usuario activo por email; si no hay, cortar. En transacción: marcar
   `used_at = NOW()` en sus tokens pendientes e insertar el nuevo con `expires_at = NOW() + 30 min`.
   Llamar a `/notifications/trigger` con `{ event: 'auth.password_reset', userId, email, locale,
   data: { userName, resetUrl, expiresMinutes: 30 } }`. Nunca loguear token ni URL.

## Flujo reset
En transacción:
```sql
UPDATE password_reset_tokens SET used_at = NOW()
 WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
 RETURNING user_id;
```
Sin fila → 400 `Enlace inválido o vencido`. Con fila: verificar usuario activo, upsert
`user_credentials(password_hash, updated_at)` (`ON CONFLICT (user_id)`), invalidar los demás tokens
pendientes. Tras el commit, `revokeAllUserTokens(userId)`. El UPDATE condicional hace el uso único
atómico ante dos peticiones simultáneas.

## Validación
- forgot: `email` (zod email, lowercase), `locale` `es|en` opcional (catch → `es`).
- reset: `token` string 43 caracteres base64url, `password` min 8 / max 128.

## Rate limit
`authLimiter` (10/15 min por IP) en ambas. Nota: detrás del proxy de Next la IP vista es la del
contenedor web (igual que login hoy); por eso el límite por email en Redis es el control efectivo
contra spam a una víctima. No se reenvía `X-Forwarded-For` desde el cliente (sería falsificable).

## Web
`/forgot-password`: campo email → POST `/api/password/forgot` con `locale` del contexto → siempre
muestra "Si el correo está registrado, te enviamos un enlace". `/reset-password?token=`: nueva
contraseña + confirmar (mismas reglas que registro) → POST `/api/password/reset` → `/login?reset=1`.
Sin token en la URL → mensaje de enlace inválido con link a `/forgot-password`. Las rutas proxy
solo reenvían `{email, locale}` / `{token, password}`.

## Ajustes tras `/code-review high`
- forgot ya no invalida los tokens previos (un tercero no puede anular el enlace de la víctima ni dejarla sin
  enlace si notification-service falla); todos caen al completar un reset. INSERT simple, sin transacción.
- reset: `SELECT … FOR UPDATE` del token válido → bcrypt → `UPDATE user_credentials` → consumir todos los
  tokens del usuario (bcrypt solo con token válido).
- Locale: el de la petición primero; `users.language` de respaldo (la columna nunca se escribe hoy).
- Contador por email: `MULTI` con `SET NX EX` + `INCR` (la clave nunca queda sin TTL).
- Proxy web: reenvía como `X-Forwarded-For` solo el último salto (Next solo lo añade si falta) y responde 502 JSON
  si auth cae. La página de reset descarta el token solo ante un 400.
- notification-service: `/trigger` rechaza `auth.password_reset` si `resetUrl` no empieza por
  `${WEB_BASE_URL}/reset-password?token=` (anti-phishing; `/trigger` sigue sin auth, preexistente).
