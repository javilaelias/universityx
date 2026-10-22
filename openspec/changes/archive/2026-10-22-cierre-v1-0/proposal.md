# Cierre v1.0 "Piloto vendible"

## Por qué
La cola v1.0 (deploy VPS, respaldos, email SMTP, recuperar contraseña, auth endurecida, panel admin,
marca configurable, E2E, push FCM, lanzador) quedó cerrada. Falta dejar constancia de la versión.

## Qué cambia
- `docs/07-notas-v1.0.md`: notas de versión (qué trae, cómo actualizar desde el MVP, límites conocidos).
- `ESTADO_PROYECTO.md`: versión v1.0 y casillas de cierre de JuvinRelease.
- `mv.json`: `estado_desarrollo: v1_0` (se mantiene `en_desarrollo: true`; lo quita el driver).
- `CERO.sh`: equivalente POSIX de `CERO.ps1` (faltaba en el checklist de continuidad).

## Fuera de alcance
Código de servicios, web o Android. Los hallazgos abiertos pasan a v1.1.

## Integración / reutilización
Solo documentación y un script de arranque que replica `CERO.ps1`; no hay componente nuevo.
