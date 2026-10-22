# Diseño — panel admin mínimo

## auth-service — `src/controllers/admin.controller.ts`, montado en `authRoutes` bajo `/admin`
- `GET /auth/admin/users?search=&role=&page=&limit=` → `{ users, total, page, totalPages }`.
  Columnas: id, email, full_name, role, is_active, last_login_at, created_at. `limit` ≤ 50.
  Búsqueda `ILIKE` sobre email y full_name con parámetros (`$n`), nunca interpolada.
- `POST /auth/admin/users` `{ email, fullName, role, password }` → 201 `{ user }`; 409 si el email
  existe. Contraseña con `passwordSchema` + `containsEmailLocalPart` (misma regla que registro).
  INSERT `users` + `user_credentials` en `withTransaction`.
- `PATCH /auth/admin/users/:id` `{ role?, isActive? }` (al menos uno; id UUID) →
  - 400 si `:id` es el propio admin (evita autobloqueo).
  - 409 si el cambio deja 0 admins activos (quitar rol admin o desactivar a un admin): se cuenta
    dentro de la transacción con `SELECT ... FOR UPDATE` sobre los admins activos.
  - `revokeAllUserTokens(id)` tras el UPDATE: el usuario vuelve a entrar con su rol/estado nuevo.
    El refresh ya relee rol e `is_active` de la BD.
- Roles válidos: `student | instructor | support | admin` (enum `UserRole`).

## lms-service
- `GET /api/admin/courses` (`requireRole('admin')`) → `repo.findAllCoursesAdmin()`: todos los
  cursos con instructor_name, module_count, enrolled_count; orden created_at DESC.
- `patchCourse`: busca el curso; 404 si no existe; 403 si no es dueño ni admin; filtra el body con
  zod (`createCourseSchema.partial()` + `thumbnail_url` nullable, `.strict()` no: se descartan
  claves desconocidas con `.pick`/schema propio). Claves vacías → 400.
- `requireAuth` con `{ algorithms: ['HS256'] }`.

## helpdesk-service
- `GET /api/tickets/queue?status=&page=` antes de `/:id` en el router; 403 si el rol no es
  admin/support. `ticketRepo.findAll(status, page, limit)` con JOIN users (user_name, user_email).
  `status` validado contra el enum.
- `requireAuth` con `{ algorithms: ['HS256'] }`.

## web
- `src/app/(app)/admin/page.tsx` (client): redirige a `/dashboard` si `role !== 'admin'`. Pestañas
  Usuarios (tabla + búsqueda + formulario de alta + select de rol + botón activar/desactivar),
  Cursos (lista + publicar/despublicar vía `/api/courses/[id]/publish`), Tickets (lista con filtro
  de estado, select de estado vía `/api/admin/tickets/[id]/status`, enlace a `/tickets/[id]` para
  responder).
- Proxies: `api/admin/users` (GET, POST), `api/admin/users/[id]` (PATCH), `api/admin/courses` (GET),
  `api/admin/tickets` (GET), `api/admin/tickets/[id]/status` (PUT). Helper común
  `api/admin/proxy.ts` que exige `session.user.role === 'admin'` (403) y reenvía el Bearer; el
  servicio vuelve a validar el rol (defensa en profundidad). Los query params se reenvían por
  lista blanca.
- `middleware.ts`: agrega `/admin/:path*`. Navbar: enlace `nav.admin` solo para admin.
- i18n: claves `admin.*` en ES y EN.
