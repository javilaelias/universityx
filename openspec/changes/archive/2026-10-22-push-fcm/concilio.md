# Concilio — push-fcm

Profundidad: 2 (mecánico: integración de un SDK estándar con config opcional, mismo patrón que SMTP; endpoint
nuevo con JWT del usuario, sin tocar contratos existentes).

## Reutilización — APROBADO
- `firebase-admin` (Apache-2.0) para enviar; SDK Firebase Messaging en Android (ya referenciado por `FcmService`).
  Sin cliente HTTP v1 propio. El "sin credenciales → deshabilitado" copia el patrón `SMTP_HOST=console`.
- Se reutiliza `requireAuth`, `pool`, el worker BullMQ y el cliente OkHttp con el interceptor de JWT de Android.

## Riesgo/QA — APROBADO CON CAMBIOS
- Riesgo 1: un fallo de FCM no debe reintentar el job (duplicaría email e in-app). Cambio exigido: push
  best-effort con try/catch y marca `pushSent` en el job antes del email.
- Riesgo 2: eventos solo-email (`auth.password_reset`) llevan un secreto: nunca van por push.
- Riesgo 3: tokens inválidos acumulados. Cambio exigido: borrar los tokens con
  `registration-token-not-registered` / `invalid-registration-token` / `invalid-argument`.
- Riesgo 4: IDOR en DELETE. Cambio exigido: `WHERE token = $1 AND user_id = $2`. Validar token (zod, ≤ 4096).
- Riesgo 5: Android no compila sin `google-services.json`. Cambio exigido: plugin aplicado solo si existe el
  archivo y guardar `FirebaseApp.getApps().isEmpty()` antes de usar Messaging.
- QA: tests Vitest de la lógica de push (deshabilitado, envío, limpieza de tokens) y de la validación del endpoint.
- Arquitectura de software / solución: APROBADO ambos (reversible: sin credenciales, todo queda como hoy).

VEREDICTO: APROBADO CON CAMBIOS
