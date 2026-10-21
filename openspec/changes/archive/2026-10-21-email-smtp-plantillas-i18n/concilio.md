# Concilio — email-smtp-plantillas-i18n

Profundidad: 2 (mecánico: nodemailer ya en uso, patrón i18n por diccionario, cambio de API aditivo
y opcional). Lente condicional Seguridad sumada (secretos SMTP, endpoint `/trigger` sin auth).
Verificado contra el código: `src/queues/notification.worker.ts` (transporte en import con
`SMTP_HOST==='console'`), `src/templates/email.templates.ts` (solo ES, sin escape, sin
`certificate.issued`), `src/controllers/notification.controller.ts` (schema zod de `/trigger`),
único llamador hoy `helpdesk-service` (`ticket.created`). Puerto 4003 no publicado en compose.

## Reutilización — APROBADO
nodemailer (MIT) y su `jsonTransport` ya están; Vitest y la config estilo `vitest.config.ts` de
lms-service se copian. Registro sin componente de email propio que lo reemplace. No agregar
librería de plantillas ni de i18n: un diccionario por locale alcanza para 7 eventos.

## Riesgo/QA — APROBADO CON CAMBIOS
- Riesgo mayor: con SMTP real mal configurado el worker falla y BullMQ reintenta 3 veces; el
  insert in-app ocurre antes del envío → cada reintento duplica la notificación in-app. Exigido:
  insertar la notificación in-app solo en el primer intento (`job.attemptsMade === 0`).
- `locale` desconocido no debe romper `/trigger` (helpdesk no lo envía): `default('es')` y
  `catch('es')`.
- Tests mínimos: ES/EN por evento pedido, escape HTML, evento desconocido, transporte consola vs
  SMTP (sin conectar), auth omitida sin usuario.
- Reversa: revert del commit; sin migraciones.

## Seguridad — APROBADO
Credenciales solo por env (ya en `.env.example` sin valores). Nunca loguear `SMTP_PASS` ni el
objeto transport. Escape HTML obligatorio de todo `data` interpolado (incluido `href`: solo
http/https). `/trigger` ya era interno y no publicado; no se amplía superficie. Puerta: `/code-review
low` + `/security-review`.

## Arquitectura de software — APROBADO · Arquitectura de solución — APROBADO
Extraer la creación del transporte a una función pura testeable; sin stack nuevo. Sin ADR.

VEREDICTO: APROBADO CON CAMBIOS
