# Pendientes del usuario — UniversidadX

- [ ] Recuperar contraseña (2026-10-21): en una BD ya creada, aplicar `infra/migrations/008-password-reset.sql` (comando en `docs/06-despliegue.md` §6) antes de usar "¿Olvidaste tu contraseña?".
- [ ] Smoke en navegador de `/forgot-password` → correo → `/reset-password` → `/login?reset=1`, en ES/EN y tema claro/oscuro.
- [ ] Smoke en navegador (endurecer-auth): registro con contraseña débil (mensajes ES/EN), 6 logins fallidos → aviso de bloqueo, sesión abierta > 15 min sigue llamando a la API (renovación), headers con `curl -sI`; tema claro/oscuro.
