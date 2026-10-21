# Cola de trabajo — UniversidadX

<!-- CONTRATO DE CIERRE — lo lee run-rollout.ps1 con un regex, no es decorativo.
     El ítem nace `- [ ]`. Al cerrarse, la MISMA línea pasa a `- [x]` con el resumen del cierre
     (cambiar `- [ ]` por `- [x]`, el mismo tachado de proyectos/_pendiente-sync-estado.md).
     NO borres el checkbox, NO reescribas el ítem como prosa (un `- **MB6 …** — CERRADO` rompe
     el archivo) y NO lo muevas de sección. Si el detalle no entra en una línea, dejalo
     INDENTADO debajo del ítem; la narrativa larga va a ESTADO_PROYECTO.md, no acá.
     Por qué: el driver decide si la iteración avanzó contando `- [x]` y `- [ ]` al inicio de
     línea. Un ítem cerrado en prosa es, para el driver, un ítem que NO se cerró.  -->

Versión objetivo: **v1.0 "Piloto vendible"** (2026-10-21). Ámbito **comercial**. Meta: que una academia
pueda usar la plataforma con su marca, con email real, respaldos y admin sin SQL (ver `plan_rentable.md`).

Reglas del proyecto para todos los ítems:
- Concilio por ítem antes de codificar (no hay pasada única). `[requiere concilio]` = profundidad 5;
  el resto, 2 revisores (Reutilización + Riesgo/QA).
- Puerta de salida: mecánico → `/code-review low`; `[requiere concilio]` → `/code-review high`;
  auth, secretos, API expuesta o subida de archivos → además `/security-review`.
- Todo ítem que toque UI web respeta i18n ES/EN (default ES) y tema claro/oscuro ya existentes;
  QA incluye smoke ES/EN + tema.
- Reutilizar antes de escribir: nodemailer ya está en notification-service; usar librerías OSS (no AGPL).
- Nunca commitear secretos ni `.env`; los tests existentes (Vitest) deben quedar en verde.

- [x] 1. Documentación base: README.md (qué es, arranque con START.bat/docker compose, servicios y puertos) y limpieza de PROGRESS.md (quitar credenciales en claro, resolver ítems contradictorios o marcarlo como histórico apuntando a ESTADO_PROYECTO.md). Mecánico. - cerrado 2026-10-21: README.md base (arranque, servicios y puertos según el compose, aviso de reset) y PROGRESS.md congelado como histórico, sin credenciales ni ítems contradictorios; concilio 2, code-review low sin hallazgos, QA juvinqa aprobada.
- [ ] 2. Despliegue reproducible: guía `docs/06-despliegue.md` para un VPS con `docker-compose.staging.yml`, `.env.example` completo y sin valores reales, secretos solo por variables de entorno; verificar que ningún secreto quede versionado. Mecánico + `/security-review` (secretos).
- [ ] 3. Respaldos: script programable de `pg_dump` + `mongodump` con rotación (N días) y script de restauración; probar backup → restore en local y documentarlo en la guía de despliegue. Mecánico.
- [ ] 4. Email real: notification-service envía por SMTP (nodemailer) cuando hay config SMTP y cae a consola si no; plantillas ES/EN para matrícula, ticket y certificado emitido. Mecánico.
- [ ] 5. Recuperar contraseña [requiere concilio]: `POST /auth/forgot-password` y `POST /auth/reset-password` con token de un solo uso, hash en BD y expiración; páginas web `/forgot-password` y `/reset-password`; respuesta genérica (no revela si el email existe) y rate limit. Depende del ítem 4. `/security-review`.
- [ ] 6. Endurecer auth para datos reales [requiere concilio]: política de contraseñas, bloqueo temporal por intentos, revisión de expiración/rotación de JWT y refresh, cookies/CORS de producción y headers de seguridad en la web. `/security-review`.
- [ ] 7. Panel de administración mínimo [requiere concilio]: rol admin en web `/admin` — usuarios (listar, crear, cambiar rol, desactivar), todos los cursos (publicar/despublicar) y cola de tickets como staff; endpoints protegidos por rol en los servicios. `/security-review` (API expuesta).
- [ ] 8. Marca configurable (white-label) [requiere concilio]: nombre, logo, favicon, colores (tokens de tema) y textos de pie por configuración (env o archivo de marca), sin tocar código; aplicada a web, emails, certificado PDF y manifest PWA. Default = marca actual.
- [ ] 9. E2E Playwright del flujo crítico: login → matrícula → contenido → quiz → certificado → verificación pública, más recuperar contraseña y un smoke de /admin; ES/EN y tema claro/oscuro; job en CI.
- [ ] 10. Push FCM real: endpoint para registrar el token del dispositivo, envío desde notification-service con firebase-admin (opcional por config: sin credenciales → solo in-app) y `onNewToken` de Android enviando el token. Mecánico.

## Lanzador (run.bat)

- [ ] Lanzador run.bat: `run.bat` en la raiz que levanta la app completa: BD (docker compose, espera
      a que este sana), backend y frontend, cada uno en su ventana, y abre el navegador; solo las
      piezas que existan. Si ya hay un lanzador que lo hace (`run_project.bat`, `levantar.bat`...),
      `run.bat` solo lo llama. Sin nada que levantar en la PC (app solo movil): lanza lo que exista
      (ej. `flutter run -d chrome`) o el item cierra con `N/A: <motivo>` sin crear archivo. Nunca
      destructivo: sin `down -v`, seeds ni reset de BD. `pause` solo ante error. Si el puerto de
      la BD esta ocupado, lo dice y no mata nada. Mecanico: concilio de 2, `/code-review low`.
      Evidencia: correrlo, citar las URLs que respondieron (o lo que se vio) y detener despues solo
      lo que levanto la prueba.

## Cierre de versión

- [ ] Cierre v1.0: notas de versión en `docs/07-notas-v1.0.md`, ESTADO_PROYECTO.md actualizado y `mv.json` con `estado_desarrollo: v1_0` (sin quitar `en_desarrollo` hasta que el driver cierre). Mecánico.
