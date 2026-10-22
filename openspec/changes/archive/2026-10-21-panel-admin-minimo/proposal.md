# Panel de administración mínimo

## Por qué
La v1.0 "Piloto vendible" exige que la academia opere sin SQL. Hoy no hay panel admin: crear un
usuario instructor, desactivar una cuenta, despublicar un curso ajeno o atender la cola de tickets
requiere tocar la BD. El rol `admin` ya existe en `users.role` y en el JWT.

## Qué cambia
- **auth-service**: rutas `/auth/admin/users` protegidas por `requireAuth` + `requireRole('admin')`:
  `GET` (listar, búsqueda y filtro por rol, paginado), `POST` (crear con rol y contraseña inicial
  bajo la política vigente), `PATCH /:id` (cambiar rol y/o activar/desactivar). Un admin no puede
  modificarse a sí mismo y no se puede dejar el sistema sin admin activo. Todo cambio revoca las
  sesiones (refresh) del usuario afectado.
- **lms-service**: `GET /api/admin/courses` (todos los cursos, publicados o no) solo admin. Publicar
  y despublicar reusa `POST /courses/:id/publish` (ya permite admin). `PATCH /courses/:id` pasa a
  validar dueño o admin y una lista blanca de campos (hoy cualquier instructor edita cualquier curso
  y las claves del body se usan como nombres de columna). JWT con `algorithms: ['HS256']`.
- **helpdesk-service**: `GET /api/tickets/queue` (todos los tickets con autor, filtro por estado,
  paginado) para `admin`/`support`. Cambiar estado reusa `PUT /:id/status`. JWT con HS256 fijo.
- **web**: página `/admin` (solo rol admin) con tres pestañas: Usuarios, Cursos, Tickets. Proxies
  `/api/admin/*` que exigen sesión con rol admin. Enlace "Administración" en la barra solo para
  admin. i18n ES/EN y tema claro/oscuro con los tokens existentes.

## Veredicto de integración
Se integra en la app existente (mismo usuario operador, mismo despliegue); no hay app separada.

## Reutilización
Sin dependencias nuevas: `requireRole` ya existe en auth y lms; `passwordSchema`,
`revokeAllUserTokens`, `validate`+zod, `togglePublish`, `updateStatus` y el patrón de proxies de
`web/src/app/api/*` se reusan. Ninguna librería de admin (react-admin, AdminJS) se justifica para
tres listas.

## Fuera de alcance
Auditoría de acciones admin, borrado de usuarios, edición de perfil ajeno, marca configurable
(otro ítem), revocación inmediata del access JWT (vive ≤ 15 min; el refresh se revoca al instante).
