# Pendientes del usuario — UniversidadX

- [ ] Recuperar contraseña (2026-10-21): en una BD ya creada, aplicar `infra/migrations/008-password-reset.sql` (comando en `docs/06-despliegue.md` §6) antes de usar "¿Olvidaste tu contraseña?".
- [ ] Smoke en navegador de `/forgot-password` → correo → `/reset-password` → `/login?reset=1`, en ES/EN y tema claro/oscuro.
- [ ] Smoke en navegador (endurecer-auth): registro con contraseña débil (mensajes ES/EN), 6 logins fallidos → aviso de bloqueo, sesión abierta > 15 min sigue llamando a la API (renovación), headers con `curl -sI`; tema claro/oscuro.

- **Push FCM (ítem 10, 2026-10-22):** crear el proyecto Firebase y poner `android/app/google-services.json` (no se versiona); compilar la app Android (no hay gradlew en el repo) y probar el push en un dispositivo; en el VPS, montar el JSON de la cuenta de servicio, definir `FCM_CREDENTIALS_FILE` y aplicar la migración 009 (ver `docs/06-despliegue.md`).
- **run.bat (ítem 11, 2026-10-22):** con Docker Desktop descargado, hacer doble clic en `run.bat` y confirmar que abre http://localhost:3000 con todo sano. En la prueba headless el host estaba saturado: los healthchecks no llegaban a arrancar y solo respondieron 4001, 4003, 4004, 4005, 4006, 4007 y 8082.
