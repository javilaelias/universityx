# Tareas — respaldos-pg-mongo

- [x] 1. `scripts/backup.sh` con rotación y escritura atómica.
- [x] 2. `scripts/restore.sh` con confirmación.
- [x] 3. `.gitignore`: `backups/`.
- [x] 4. Prueba local backup → restore en pila descartable (datos sembrados, borrados y recuperados; rotación).
- [x] 5. `docs/06-despliegue.md` §7 (uso, cron, restauración) y ESTADO.

## Cierre

Puerta de salida: `/code-review low` — 0 hallazgos; nada corregido ni descartado. Sin UI. Observaciones de QA no
bloqueantes (aceptadas): restore parcial si pg ok y mongo falla (la guía pide sin tráfico y es repetible); `.dump`
huérfano si falla Mongo en el backup (restore lo rechaza, se rota por antigüedad).
Validación: pila descartable `uxbackuptest` → backup rc=0 + rotación (10 días rotado, 2 días conservado) → borrado →
restore rc=0 con datos recuperados → restore repetido rc=0 → cancelación y sello inexistente rc=1 → backup con
Mongo caído rc=1 sin rotar. QA juvinqa Nivel 1: APROBADO.
