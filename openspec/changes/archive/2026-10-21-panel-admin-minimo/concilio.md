VEREDICTO: APROBADO CON CAMBIOS
Profundidad: 5 — señal que la decidió: `[requiere concilio]` y superficie de seguridad (gestión de usuarios y roles, API expuesta) en auth, lms, helpdesk y web.
Arq. software: CON CAMBIOS — patrón por servicio correcto (cada servicio valida su rol, la web solo hace proxy); precisar la guarda del último admin y el manejo de errores async en helpdesk.
Arq. solución: APROBADO — sin dependencias ni migraciones; el rol ya está en `users.role` y en el JWT; Express 4 en los tres servicios.
Cambios exigidos:
1. Último admin: `FOR UPDATE` no admite agregados; bloquear con `SELECT id FROM users WHERE role='admin' AND is_active FOR UPDATE` dentro de `withTransaction` y contar filas en código antes del UPDATE.
2. helpdesk-service (Express 4, sin manejador de errores): un id no UUID en `/:id` rechaza la promesa sin capturar y puede tumbar el proceso. Envolver los handlers del router en un `asyncHandler` y agregar un manejador de errores 500 en `server.ts`; validar `:id` UUID en `PUT /:id/status` (lo usa el panel).
3. `PATCH /auth/admin/users/:id` y `/:id` en lms/helpdesk: validar UUID antes de tocar la BD (400).
4. Respuestas de usuario sin `password_hash` (no se selecciona `user_credentials`); el POST devuelve las columnas explícitas.
5. lms `patchCourse`: el schema de lista blanca debe aceptar exactamente lo que manda la edición del instructor (`title, slug, description|null, thumbnail_url|null, level, language, tags`) para no romper `instructor/courses/[id]/edit`; `is_published` NO se acepta por PATCH (solo por `/publish`).
6. Tests: 403 con rol instructor/support en `/auth/admin/users`, autoedición 400, último admin 409, revocación llamada; lms: `PATCH` de curso ajeno 403, clave desconocida descartada, `GET /admin/courses` 403 para instructor.
7. Web: el proxy reenvía solo `search, role, page, status` (lista blanca) y codifica con `URLSearchParams`; el `:id` del path se valida como UUID antes de construir la URL.
Mayor riesgo y mitigación: escalada de privilegios o autobloqueo (un admin que se quita el rol, o un endpoint sin `requireRole`) → guardas 1 y autoedición, `requireRole('admin')` a nivel de router en `/admin` y tests 403 por rol (6).
Reutilizar del registro: `requireRole` (auth, lms), `passwordSchema` + `containsEmailLocalPart`, `withTransaction`, `revokeAllUserTokens`, `validate`+zod, `togglePublish` y `updateStatus` existentes, patrón de proxies `api/*` con `getServerSession`, `useLang().t` y tokens `var(--…)` del tema.

## Arquitecto
Software: rutas admin en el servicio dueño del dato (usuarios en auth, cursos en lms, tickets en helpdesk); la web no concentra lógica. El refresh ya relee rol e `is_active`, así que revocar refresh tokens basta para que el cambio surta efecto en ≤ 15 min (vida del access JWT) — aceptado y documentado.
Solución: sin librerías nuevas; HS256 fijo en lms y helpdesk cierra en esos dos servicios el hallazgo de `algorithms` (los demás siguen en el ESTADO).

## Reutilización
react-admin/AdminJS descartados: tres listas no justifican una dependencia estructural ni un segundo sistema de UI. Todo se arma con lo ya instalado (zod, lucide, clsx).

## Producto/UX
Alcance correcto para el piloto: alta de instructores/soporte, baja de cuentas, control editorial y cola de soporte. Contraseña inicial fijada por el admin (el usuario puede cambiarla con "olvidé mi contraseña"); invitación por email queda para después. La respuesta a un ticket se hace en la página de ticket existente (staff ya puede responder ahí).

## Riesgo/QA
Reversa: revert del commit; sin migraciones. `PATCH /courses/:id` endurecido puede romper la edición del instructor si la lista blanca no coincide (cambio 5); QA debe probar guardar un curso desde el editor. Web sin Vitest: `tsc --noEmit` + `next build`; smoke ES/EN + tema de `/admin` en Nivel 2.

## Seguridad
OWASP A01 (control de acceso): rol verificado en el servicio, no solo en la web; ids validados; búsqueda parametrizada. A03: la lista blanca de `patchCourse` elimina la inyección por nombre de columna. A07: alta con la misma política de contraseñas; los cambios revocan sesiones. Revisión ofensiva: un instructor intentando `PATCH /auth/admin/users/<suyo>` con `role=admin` → 403 por `requireRole` (test).

## Simplicidad
Una sola página con pestañas, sin paginación sofisticada (anterior/siguiente). Sin auditoría ni borrado de usuarios.
