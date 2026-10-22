# Tareas — push-fcm

- [x] 1. Migración `infra/migrations/009-device-tokens.sql` (idempotente)
- [x] 2. notification-service: `firebase-admin`, `FCM_CREDENTIALS_FILE` opcional en env, `src/push/fcm.ts`
- [x] 3. Endpoints `POST/DELETE /notifications/devices` (JWT, zod, DELETE con dueño)
- [x] 4. Worker: push best-effort tras in-app, `pushSent`, nunca para eventos solo-email, limpieza de tokens inválidos
- [x] 5. Tests Vitest (push y validación)
- [x] 6. Android: dependencia firebase-messaging, plugin google-services condicional, `DeviceApi`, `PushTokenRegistrar`, `onNewToken`, login/logout
- [x] 7. `.env.example`, staging compose, `docs/06-despliegue.md`

## Cierre
Puerta de salida: `/code-review low`, con 2 hallazgos y los 2 corregidos: (1) `messaging/invalid-argument` sale de los códigos de token muerto, porque FCM también lo da ante un payload mal formado y borraría todos los tokens; es un desvío documentado del riesgo 3 del concilio. (2) `currentToken()` en Android lleva un timeout de 5 s para que el logout no quede colgado. `/security-review` sin hallazgos ≥ 8. No hay nada descartado. No toca UI web. QA juvinqa APROBADO: tsc OK, vitest 32/32. El build Android no se verificó porque no hay gradlew en el repo, así que queda manual.
