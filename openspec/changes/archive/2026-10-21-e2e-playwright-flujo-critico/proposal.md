# Propuesta — E2E Playwright del flujo crítico (ítem 9)

## Por qué
v1.0 "Piloto vendible" necesita una prueba de punta a punta que demuestre que una academia puede recorrer el
flujo que vende: entrar, matricularse, avanzar, aprobar el quiz, obtener el certificado y que un tercero lo
verifique. Hoy solo hay Vitest por servicio y ninguna prueba en navegador.

## Qué cambia
- Paquete nuevo `e2e/` (Playwright, Apache-2.0; `pg` MIT) con su `package.json`, `playwright.config.ts` y specs:
  - `flujo-critico.spec.ts`: registro de un estudiante nuevo → login → catálogo → curso "Fundamentos de Bases de
    Datos" → matrícula → contenido visible y desbloqueado → video y documento marcados como vistos → quiz
    aprobado → reclamar certificado en `/profile` → `/verify/<id>` público (contexto sin sesión).
  - `recuperar-contrasena.spec.ts`: `/forgot-password` responde genérico; el token se siembra en BD (solo el
    SHA-256, como hace el servicio) porque el correo va a consola en dev/CI; `/reset-password?token=…` → login con
    la clave nueva y la vieja rechazada.
  - `admin-smoke.spec.ts`: admin sembrado entra a `/admin`; usuarios, cursos y tickets cargan; un estudiante no
    entra.
  - `i18n-tema.spec.ts`: default ES, cambio a EN y persistencia tras recargar; tema claro→oscuro (`html.dark`) y
    persistencia.
- **Bug del flujo que la E2E destapa (se corrige, mínimo):** "Reclamar certificado" del perfil manda `{}` y
  credentials-service exige `userId`+`courseId` (siempre 400). `POST /credentials` pasa a: `userId` = el del token
  (otro usuario solo con rol admin), `courseId` opcional; sin `courseId` emite las credenciales de toda matrícula al
  100 % sin certificado (201 con la lista; 422 si no hay ninguna). Cierra además el IDOR de emitir a nombre de otro.
- CI: job `e2e` en `ci.yml` que genera `.env` de servicios con valores descartables (`e2e/ci-env.sh`), levanta
  `docker compose` (sin pgadmin/mongo-express), espera la web, corre Playwright y sube el reporte si falla.

## Fuera de alcance (hallazgos, no se tocan)
- La web no tiene visor de contenido ni botón "marcar como visto": un usuario real no llega al 100 % desde la UI.
  La E2E marca video y documento por `POST /api/progress` (la misma ruta BFF que usaría ese botón) y lo deja dicho.
- Tema por defecto `light` en vez de `prefers-color-scheme`; página de curso sin i18n.

## Integración
No es app nueva: es la suite de pruebas del propio repo.

## Desvío aprobado en concilio (addendum, ver `concilio.md`)
Al correr la E2E aparecieron dos roturas más del flujo de estudiante en la web, preexistentes:
- `/courses/[id]` mostraba siempre "Curso no encontrado": lms devuelve el curso plano (`type`, `duration_seconds`)
  y la página espera `{ course }` con `content_type`/`duration_minutes`.
- El quiz no cargaba ni mostraba el resultado: lms devuelve `quiz.questions[].text`/`options[].text` y
  `{ attempt: { score, passed } }`; la página espera `questions[].question_text`/`option_text` y
  `{ score, passed, correct, total }`.
Arreglo: adaptadores en los BFF de la web (`web/src/lib/lms-shape.ts`, usados por `/api/courses/[id]`,
`/api/quizzes/[id]` y `/submit`), sin cambiar textos de pantallas; lms agrega `correct`/`total` (aditivo) al
resultado del intento; la página del curso toma `enrolled` de la respuesta (antes un alumno ya matriculado no
veía el enlace al quiz) y el fetch del curso pasa a `no-store` (la respuesta es por usuario).
Además, la E2E se presenta con una IP de prueba por test (`X-Forwarded-For`, la web pasa el último salto al
limitador de auth-service: 10 login/registro por IP cada 15 min); no cambia el producto.
