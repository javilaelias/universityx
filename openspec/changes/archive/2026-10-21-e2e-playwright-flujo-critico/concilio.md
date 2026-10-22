VEREDICTO: APROBADO CON CAMBIOS
Profundidad: 5 — señal que la decidió: dependencia estructural nueva (Playwright + job de CI con la pila completa) y toca un endpoint expuesto (`POST /credentials`).
Arq. software: OK — paquete `e2e/` aislado, sin acoplarse al build de la web; el fix de `issue` es local al controlador y compatible con el llamador actual (web).
Arq. solución: OK — Playwright (Apache-2.0) y `pg` (MIT) son el estándar; en CI la pila se levanta con el mismo `docker-compose.yml`, sin infraestructura nueva.
Cambios exigidos: (1) los datos de prueba son propios de cada corrida (email único) y no dependen de estudiantes sembrados, para poder repetir la suite sin reset; (2) el token de reset se siembra solo como SHA-256 y con expiración, igual que el servicio; (3) el job de CI no usa secretos del repo: valores descartables generados en el runner; (4) la E2E no corre contra una BD de trabajo: localmente solo con volúmenes recién creados o documentado en README; (5) tests Vitest para `issue` (propio, admin a otro, no-admin a otro → 403, claim-all, 422).
Mayor riesgo y mitigación: suite frágil por tiempos de arranque de 9 servicios → espera explícita de `/api/health`/login antes de correr, 1 worker, reintento 1 en CI y trazas al fallar.
Reutilizar del registro: nada del registro aplica; se reutilizan la ruta BFF `/api/progress`, el seed 004/005 (curso y admin) y el compose existente.

Lentes:
- Arquitecto: ver sub-veredictos. Wiring precisado: la web reclama con `POST /api/credentials` `{}`; el BFF ya reenvía el body y el Bearer, así que basta con el cambio en el servicio.
- Reutilización: no escribir un mailcatcher; sembrar el token en BD evita depender del SMTP. Reusar `password-policy` (clave E2E de 12+ con letras y números).
- Producto/UX: el flujo cubre lo que se vende. El hueco del visor de contenido se reporta, no se construye aquí.
- Riesgo/QA: exigidos (1)-(5). Plan de reversa: revertir el commit; el job e2e no bloquea a los demás jobs (independiente).
- Simplicidad: un solo navegador (chromium), sin page objects; helpers mínimos.
- Seguridad (condicional): el cambio de `issue` reduce superficie (cierra IDOR); `/security-review` en la puerta de salida.

Addendum (desvío durante la implementación, mismos 5 lentes): APROBADO.
- Arq. software: OK — adaptar la forma en el BFF es el patrón ya usado (las rutas `/api/*` ya hacen de proxy); cambio en lms solo aditivo.
- Arq. solución: OK — sin dependencias nuevas.
- Reutilización: tipos de `web/src/lib/api.ts` como contrato de destino; no se reescriben páginas.
- Producto/UX: sin esto el flujo vendible no funciona; los textos no cambian (las páginas tocadas siguen sin i18n: hallazgo aparte).
- Riesgo/QA: la E2E cubre los tres adaptadores; Vitest de lms y credentials en verde.
- Simplicidad: adaptador de ~50 líneas en vez de cambiar el contrato de lms (lo usa también Android).
