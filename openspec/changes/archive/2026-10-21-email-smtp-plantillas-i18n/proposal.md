# Email real: SMTP con fallback a consola y plantillas ES/EN

## Por qué
v1.0 "Piloto vendible" exige email real. notification-service ya usa nodemailer, pero
solo cae a consola con `SMTP_HOST=console`; con `SMTP_HOST` vacío intenta conectarse a
localhost. Las plantillas están solo en español, no hay plantilla de certificado emitido y
los datos se interpolan en HTML sin escapar.

## Qué cambia (solo `services/notification-service`)
- Transporte: SMTP real si hay `SMTP_HOST` (≠ `console`) configurado; si falta o es
  `console`, transporte JSON que escribe el correo en el log. Auth solo si hay `SMTP_USER`.
- Plantillas ES/EN (default ES) para `enrollment.confirmed`, `ticket.created`, `ticket.reply`
  y el nuevo `certificate.issued`; los demás eventos existentes también ganan EN.
- Locale opcional `locale: 'es' | 'en'` en el payload de `/notifications/trigger`
  (default `es`; valor desconocido → `es`).
- Datos interpolados se escapan (HTML) para evitar inyección en el correo.
- Evento desconocido → plantilla genérica (antes: `undefined` y crash del worker).
- Tests Vitest de plantillas y selección de transporte.

## Reutilización
nodemailer (MIT) ya es dependencia; Vitest ya se usa en los demás servicios. Nada nuevo.

## Fuera de alcance
Cablear la emisión desde lms-service (matrícula) y credentials-service (certificado): hoy solo
helpdesk llama a `/trigger`. Queda como trabajo nuevo.
