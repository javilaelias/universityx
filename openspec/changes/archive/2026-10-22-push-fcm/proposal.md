# Push FCM real

## Por qué
notification-service solo guarda la notificación in-app y manda email; Android tiene `FcmService` pero
`onNewToken` es un TODO y el backend no conoce el token del dispositivo. Ítem 10 de la cola v1.0.

## Qué cambia
- **BD:** migración `009-device-tokens.sql` — tabla `device_tokens` (token UNIQUE, user_id, platform),
  idempotente (en BD existente se aplica a mano, como la 008).
- **notification-service:**
  - `POST /notifications/devices` `{ token, platform? }` (JWT) — upsert: un token pertenece a un solo
    usuario (si cambia de cuenta en el mismo equipo, se reasigna).
  - `DELETE /notifications/devices` `{ token }` (JWT) — borra solo si el token es del usuario (logout).
  - `src/push/fcm.ts`: `firebase-admin` (Apache-2.0) **opcional por config**: `FCM_CREDENTIALS_FILE`
    (ruta al JSON de cuenta de servicio). Sin la variable → push deshabilitado, solo in-app + email.
  - Worker: tras guardar la notificación in-app (eventos no solo-email), envía push a los tokens del
    usuario, best-effort (un fallo de FCM no reintenta el job ni duplica email), una sola vez por job
    (`pushSent`), y borra los tokens que FCM reporta como inválidos/no registrados.
- **Android:** dependencia `firebase-messaging` (BOM); plugin google-services aplicado solo si existe
  `app/google-services.json` (no se versiona). `DeviceApi` (Retrofit a :4003), `PushTokenRegistrar`:
  `onNewToken` registra el token si hay sesión; tras el login se pide el token actual y se registra;
  en logout se desregistra. Sin Firebase inicializado → no hace nada.
- **Config/docs:** `.env.example`, staging compose (`FCM_CREDENTIALS_FILE`), `docs/06-despliegue.md`.

## Reutilización
- OSS: `firebase-admin` (Apache-2.0) para el envío; Firebase Messaging SDK en Android (ya importado en
  `FcmService`, faltaba la dependencia). Interno: patrón de config opcional igual al de SMTP (`console`).

## Fuera de alcance
Preferencias de push por usuario, topics, web push, iOS.

## Riesgos
- Android sin `gradlew` en el repo: el build no se puede verificar aquí → pendiente manual.
- Endpoint expuesto con JWT (tokens ajenos no se pueden borrar; reasignar un token solo afecta a ese equipo).
