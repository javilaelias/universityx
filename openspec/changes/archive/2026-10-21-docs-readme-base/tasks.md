# Tareas: docs-readme-base

- [x] 1. Crear `README.md` (qué es, stack, arranque, servicios y puertos, tests, docs; advertir que `reset` borra volúmenes).
- [x] 2. `PROGRESS.md`: aviso de histórico → `ESTADO_PROYECTO.md`.
- [x] 3. `PROGRESS.md`: quitar credenciales en claro (remitir a `.env.example`).
- [x] 4. `PROGRESS.md`: resolver ítems contradictorios (hecho y pendiente a la vez).
- [x] 5. Verificar que ningún `.md` tocado contenga contraseñas (`grep`).

## Cierre

Puerta de salida: `/code-review low` — 0 hallazgos (nota mongo-express 8082 vs 8081 descartada: el compose mapea `${ME_PORT:-8082}:8081`). Sin UI ni código. QA juvinqa Nivel 1: APROBADO.
