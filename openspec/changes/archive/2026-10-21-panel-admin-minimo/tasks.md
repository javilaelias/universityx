# Tareas — panel admin mínimo

- [x] 1. auth-service: `admin.controller.ts` (listar, crear, patch con guardas de autoedición y último admin, revocar sesiones) y rutas `/auth/admin/users` con `requireRole('admin')`.
- [x] 2. auth-service: tests Vitest (403 no admin, listar, crear 201/409/política, patch rol, autoedición 400, último admin 409, revoca sesiones).
- [x] 3. lms-service: `GET /api/admin/courses`, `patchCourse` con dueño/admin + lista blanca, JWT HS256; tests.
- [x] 4. helpdesk-service: `GET /api/tickets/queue` (admin/support), JWT HS256.
- [x] 5. web: proxies `/api/admin/*` con chequeo de rol, página `/admin` (3 pestañas), middleware, Navbar, i18n ES/EN.
- [x] 6. Verificación: Vitest en auth y lms, `tsc` de los servicios tocados y `next build` de la web.

## Cierre
Puerta de salida: `/code-review high` — 10 hallazgos, 9 corregidos (handler 4xx helpdesk, 23505→409 en patchCourse y alta, 404 tras update, subconsulta en cursos admin, escape ILIKE, UI error/try-finally, limit negativo, isStaff, Promise.all), 1 descartado (helper común con register/UUID único: duplicación menor entre paquetes distintos). `/security-review`: sin hallazgos ≥8; corregida comparación de id sensible a mayúsculas en updateUser (+test). QA juvinqa APROBADO: auth 64/64, lms 18/18, tsc en 4 paquetes, next build OK. UI: smoke estático ES/EN + tema de `/admin` (sin navegador; Docker no levantado), editor de cursos del instructor verificado contra la lista blanca de PATCH.
