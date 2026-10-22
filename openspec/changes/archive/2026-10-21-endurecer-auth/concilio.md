VEREDICTO: APROBADO CON CAMBIOS
Profundidad: 5 — señal que la decidió: `[requiere concilio]` y superficie de seguridad (login, sesiones, secretos, headers) en auth-service + web.
Arq. software: CON CAMBIOS — módulos y patrón Redis (`countResetRequest`) bien reutilizados; la renovación de sesión tiene carrera entre pestañas y el reset no tiene el email para limpiar el bloqueo.
Arq. solución: APROBADO — sin dependencias nuevas; refresh solo vía `update()` es correcto porque `getServerSession` en route handlers no persiste la cookie (rotar ahí revocaría el refresh guardado).
Cambios exigidos:
1. `SessionKeeper`: varias pestañas renovarían a la vez con el mismo refresh (rotación → la segunda recibe 401 y cerraría la sesión). Serializar con Web Locks (`navigator.locks.request`) y, dentro del lock, releer la sesión (`getSession`) y solo llamar a `update()` si sigue por vencer. Sin Web Locks: seguir igual (degradación aceptada).
2. Refresh fallido por red/5xx no cierra la sesión: solo un 401 de `/auth/refresh` marca `RefreshAccessTokenError`; lo demás deja el token como estaba y se reintenta.
3. `resetPassword`: devolver el email (`RETURNING u.email`) para limpiar `loginfail:` tras un reset válido.
4. Login bloqueado: mensaje i18n que diga que espere 15 min o restablezca la contraseña; mismo 429 exista o no el email (test).
5. Reset en la web: un 400 con `fields` es de política (mostrar mensaje), no token inválido.
6. Tests extra: refresh token sin `algorithms` HS256 rechazado (token HS512 firmado con el mismo secreto → 401), production con `JWT_REFRESH_SECRET` igual a `JWT_SECRET` rechazado por el schema.
Mayor riesgo y mitigación: cerrar sesiones legítimas (carrera de renovación, bloqueo de cuenta por un tercero) → cambios 1–2; bloqueo de 15 min y reset disponible (riesgo aceptado, documentado).
Reutilizar del registro: `countResetRequest` (MULTI SET NX + INCR), `sha256` de `reset-token.service`, `validate`+zod, criterio de IP de `api/password/proxy.ts`, `t()` de `lib/i18n.ts` (las claves `register.*` ya existen), helmet ya activo en auth-service, `useSecureCookies` automático de NextAuth con https.

## Arquitecto
Software: separar la política en un módulo evita dos reglas distintas (register/reset). Bloqueo antes de BD/bcrypt correcto. Precisar 1 y 3.
Solución: `trigger === 'update'` existe en next-auth 4.24 (instalado ^4.24.7). HSTS solo en build de production; en http localhost el navegador lo ignora.

## Reutilización
Sin librerías nuevas: zod para la política (zxcvbn sería más preciso pero pesado; la lista corta basta para el piloto). Patrón Redis ya probado.

## Producto/UX
Las contraseñas existentes siguen funcionando (la regla se aplica al fijarla). Mensaje de bloqueo accionable (4). La página de registro hoy no usa `t()`: pasarla a las claves existentes es parte del ítem (la toca).

## Riesgo/QA
Reversa: revert del commit; sin migración de BD. Tests mínimos: política, bloqueo, HS256, env production (6). La web no tiene Vitest: `tsc` + `next build`; smoke en navegador de login/registro/reset ES/EN + tema queda a juvinqa Nivel 2 (estático si no hay contenedores).

## Simplicidad
Sin detección de reuso de refresh ni CSP con nonce (fuera de alcance, bien). La lista de comunes ≤ 30 entradas en código, sin archivo aparte.

## Seguridad (lente condicional)
OWASP A07: bloqueo + rate limit por IP real cubren fuerza bruta y relleno de credenciales. Sacar `refreshToken` de la sesión del cliente reduce el impacto de un XSS. Ofensiva breve: un atacante puede bloquear cuentas conocidas 15 min (aceptado) y falsear `X-Forwarded-For` solo si llega a auth-service directo (en staging está en 127.0.0.1).
