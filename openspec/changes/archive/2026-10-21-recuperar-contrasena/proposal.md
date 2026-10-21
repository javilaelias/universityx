# Recuperar contraseña

## Por qué
auth-service no tiene recuperación de contraseña (hallazgo en ESTADO). Una academia piloto (v1.0
"Piloto vendible") no puede depender de que un admin edite la BD cada vez que un alumno olvida su
clave. El email real (ítem 4) ya está: notification-service envía por SMTP.

## Qué cambia
- **auth-service**
  - `POST /auth/forgot-password` `{ email, locale? }` → siempre `202 { message }` genérico (no revela
    si el email existe). Si el usuario existe y está activo: invalida sus tokens de reset previos,
    crea uno nuevo (32 bytes aleatorios, base64url), guarda **solo su SHA-256** con expiración de
    30 min y pide a notification-service el email `auth.password_reset` con el enlace
    `<WEB_BASE_URL>/reset-password?token=…`. El trabajo corre después de responder (tiempo de
    respuesta igual exista o no el email).
  - `POST /auth/reset-password` `{ token, password }` (mín. 8 como el registro) → consume el token
    de forma atómica (un solo uso, no vencido), guarda el nuevo hash bcrypt (upsert en
    `user_credentials`), invalida los demás tokens del usuario y revoca todas sus sesiones
    (refresh tokens). Token inválido/vencido/usado → `400` con mensaje único.
  - Rate limit: el `authLimiter` existente por IP en ambas rutas + límite por email en Redis
    (máx. 3 solicitudes por hora; al exceder, misma respuesta genérica y no se envía).
  - Env nueva `NOTIFICATION_SERVICE_URL` (default `http://localhost:4003`), cableada en compose y
    staging.
- **BD:** migración `infra/migrations/008-password-reset.sql` (tabla `password_reset_tokens`).
- **notification-service:** evento `auth.password_reset` (plantillas ES/EN, enlace solo http/https)
  marcado como **solo email**: el worker no guarda notificación in-app (el `data` lleva el enlace con
  el token y no debe persistir en la tabla `notifications`).
- **web:** páginas `/forgot-password` y `/reset-password` (estilo de login/registro, i18n ES/EN y
  tema claro/oscuro existentes), enlace "¿Olvidaste tu contraseña?" en `/login`, rutas proxy
  `/api/password/forgot` y `/api/password/reset`. Tras el reset, redirige a `/login?reset=1`.

## Fuera de alcance
Cambio de contraseña con sesión iniciada, recuperación en Android, CAPTCHA, runner de migraciones.

## Veredicto de integración
Módulo dentro de auth-service existente (mismo dominio); sin app nueva.

## Reutilización
`crypto` de Node (stdlib) para token y hash; `express-rate-limit`, Redis, bcrypt (`password.service`),
zod y `validate` ya en auth-service; plantillas y transporte de notification-service (ítem 4);
patrón `notifyAsync` de helpdesk-service. Sin dependencias nuevas.
