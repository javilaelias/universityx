# Tareas

- [x] 1. `src/mail/transport.ts`: `createMailTransport(env)` → SMTP o JSON (consola); `isConsoleMode`.
- [x] 2. `src/templates/email.templates.ts`: ES/EN, `certificate.issued`, escape HTML (href solo http/https), fallback genérico. Nunca loguear credenciales.
- [x] 3. Controller: `locale` opcional (`default`+`catch` → `es`); worker lo pasa a `buildTemplate` e inserta la notificación in-app una sola vez (marca `inAppStored` en el job tras el insert).
- [x] 4. `.env.example`: documentar que `SMTP_HOST` vacío = consola.
- [x] 5. Vitest (devDependency + script `test`) con tests de plantillas y transporte; typecheck en verde.

## Cierre
Puerta de salida: `/code-review low` → 2 hallazgos: (1) guard `attemptsMade===0` perdía la notificación in-app si fallaba el insert → corregido (marca `inAppStored` vía `job.updateData` tras el insert); (2) `.trim()` sobre `SMTP_HOST` undefined → descartado (zod default `console`, tipo string). `/security-review` → 0 hallazgos. tsc OK, Vitest 13/13. juvinqa: APROBADO. Sin UI (no aplica smoke ES/EN ni tema); integración Redis/Postgres del worker sin e2e (limitación declarada).
