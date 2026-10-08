# Plan rentable — UniversidadX

VIABILIDAD: media | PRIMER-DOLAR: 21 | ESFUERZO: 60
RESUMEN: Vender implementación y hosting gestionado (white-label) del LMS a una academia o institución pequeña de LATAM, con setup único más cuota mensual, antes de lanzar un SaaS abierto.
BLOQUEO-MANUAL: Conseguir el primer cliente piloto (contacto y negociación comercial). Abrir la cuenta de cobro: RUC y recibo por honorarios, o Stripe/Lemon Squeezy/PayPal. Contratar el VPS y el dominio. Configurar un SMTP real y las claves del proveedor SSO del cliente. Revisar la licencia y la marca de los assets antes de dar el servicio como white-label.

## Vía recomendada
**Modelo:** servicio de implementación y hosting gestionado, sin publicar en tienda. Se cobra setup único más mensualidad, con la marca del cliente (white-label).

**Cliente concreto:** academias privadas, institutos, ONG de capacitación o áreas de capacitación de pymes en Perú/LATAM. Quieren aula virtual propia con certificados, pero no pueden pagar los ~US$1.500–5.000/mes de un Moodle gestionado ESTIMADO (supuesto: rango tomado de una guía de compra de terceros, no es un precio publicado).

**Precio propuesto (ESTIMADO, supuesto: pocos competidores locales publican tarifas):**
- Setup: US$400–800 por marca, tema y dominio, importación de cursos y configuración del SSO/SMTP.
- Mensualidad: US$99–199 por hasta 500 usuarios, con hosting, respaldos y soporte básico.

Este precio queda por debajo del tope de las plataformas SaaS. Teachable cuesta unos US$39–399/mes y Thinkific unos US$49–199/mes, según fuentes que discrepan entre sí. Esas plataformas no ofrecen el diferenciador de este producto, que es lo siguiente:
- Modo offline con sync, útil con conectividad irregular.
- Insignias Open Badges 3.0 y certificados en PDF.
- Mesa de ayuda integrada, notificaciones y PWA/Android.

**Por qué esta vía:** el código ya tiene 8 servicios (auth, lms, sync, credentials, helpdesk, notification, ai, media) y docker-compose. Eso permite desplegar una instancia por cliente sin construir nada nuevo. El mercado local de implementación de Moodle se vende por servicio, no por licencia. Existe un proveedor local que ofrece "SaaS a medida" con la marca del cliente y no publica tarifas, y hay licitaciones de aula virtual con alojamiento y soporte (por ejemplo, la OIM en agosto de 2026). Eso valida que se paga por servicio.

## Camino de cobro
- **Canal inicial:** transferencia o Yape/Plin, o PayPal, con factura o recibo por honorarios (persona natural, categoría cuarta, sin RUC con ventas; si el cliente exige factura se necesita RUC). Para clientes del exterior, Stripe o Lemon Squeezy. ESTIMADO: no verifiqué los requisitos SUNAT vigentes; confirmar con un contador.
- **Formalidad:** un contrato simple de servicio (SLA, respaldos, propiedad de los datos) y una política de privacidad conforme a la Ley 29733 de protección de datos de Perú.
- **Bloqueos de terceros:**
  - Alta de VPS y dominio: 1 día.
  - SMTP real: 1–2 días.
  - SSO SAML/OIDC: depende de TI del cliente, 1–3 semanas; se puede arrancar con correo y contraseña.
- **Riesgo legal:** datos de estudiantes (incluidos menores), responsabilidad por la certificación (usar "certificado de participación", no títulos oficiales) y licencias de dependencias; revisar `package.json` antes del white-label. Hoy no hay ficha mv.json ni README, lo que complica la entrega.

## Plan 7 / 30 días
**Días 1–7**
1. Desplegar `docker-compose.staging.yml` en un VPS barato y verificar login, matrícula, quiz, certificado y PWA con el seed.
2. Hacer una demo grabada de 3 minutos y una landing de una página con el precio de la oferta piloto.
3. Contactar a 20 academias, institutos o ONG (LinkedIn, Facebook, WhatsApp) con una oferta fundadora: setup a mitad de precio a cambio de un testimonio.
4. Escribir el contrato y la plantilla de cotización.

**Días 8–30**
5. Reunión de descubrimiento con 3–5 interesados. Cerrar 1 piloto con anticipo del 50 % del setup (primer dólar, objetivo día ~21).
6. Montar la instancia del cliente: tema y logo, dominio, SMTP, carga de sus cursos, capacitación de 1 h.
7. Cobrar el saldo del setup y activar la mensualidad.
8. Configurar respaldos automáticos de Postgres y Mongo y monitoreo básico.
9. Pedir un testimonio y un referido; repetir con los 2 siguientes clientes.

## Otras vías
- **Suscripción SaaS multi-tenant:** el código no es multi-tenant y la distribución sería lenta; considerarla después de 3 clientes.
- **Venta única de licencia / código:** posible a US$1.500–3.000 por instalación autoalojada, pero el soporte es costoso.
- **White-label para integradores:** revender a agencias de e-learning que ya venden Moodle; más lento (1–2 meses).
- **Consultoría:** horas de migración a offline-first o PWA para otros LMS, US$30–60/h ESTIMADO.
- **Publicidad:** no aplica; no hay tráfico y es una plataforma de pago por cliente.
- **Afiliados:** no encaja como vía principal; solo un 10–20 % por referido de hosting.
- **Marketplace de cursos:** exige público y contenido propio; no es inmediata.
- **Venta de la app:** el valor está en el código, sin tracción. Hoy vale poco, y solo tiene sentido con clientes de pago.

## Lo mínimo que falta en la app
- **Cobro dentro de la plataforma:** no hace falta para el piloto, porque se cobra por fuera como servicio.
- **Marca configurable:** logo, colores y dominio por variable de entorno, sin tocar código.
- **SMTP real:** el email hoy sale por consola en dev.
- **Despliegue y respaldos:** guía de despliegue (README), script de respaldo y pasar los `.env` a secretos.
- **Panel de administración mínimo:** crear cursos y usuarios sin SQL. El PROGRESS.md solo menciona el CRUD de cursos como pendiente.
- **Seguridad:** revisar auth antes de datos reales, porque el SSO real quedó como stub. Usar contraseña hasta que se configure con un cliente.

## Evidencias
| URL | afirmación | fecha |
|---|---|---|
| D:\MV\UniversidadX\PROGRESS.md | Servicios auth, lms, sync, notification, helpdesk, ai y credentials listos y probados E2E; docker-compose con 13 servicios | 2026-06-17 |
| https://ecommerce-platforms.com/compare/teachable-pricing-plans | Teachable cobra ~US$39/89/189/399 al mes (fuentes discrepan en el plan gratuito) | 2026-10-08 |
| https://schoolmaker.com/blog/thinkific-pricing | Thinkific cobra ~US$49/99/199 al mes; fuentes discrepan sobre cambios de precio en 2026 | 2026-10-08 |
| https://www.compono.com/articles/moodle-workplace-pricing-hidden-costs-2026 | Moodle gestionado cuesta ~US$1.500–5.000/mes en hosting y soporte según una guía de terceros (no es precio oficial); Moodle Workplace se cotiza por partner | 2026-10-08 |
| https://www.ungm.org/Public/Notice/310362 | La OIM licitó en agosto de 2026 la implementación, alojamiento y soporte de un aula virtual en Perú | 2026-08-10 |
| Resultado de búsqueda (E-Learning Soluciones, Perú) | Proveedor local ofrece Moodle SaaS a medida con la marca del cliente, sin publicar tarifas | 2026-10-08 |
