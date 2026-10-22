# Concilio — cierre-v1-0

Profundidad: 2 (mecánico: documentación de cierre, metadato de versión y script de arranque que replica
uno existente; no toca código ni contratos).

## Reutilización — APROBADO
- Las notas salen del ESTADO y de los cambios archivados; `CERO.sh` copia el flujo de `CERO.ps1`
  (prerrequisitos → `docker compose up -d --build` → espera Postgres healthy → `npm install` de la web).

## Riesgo/QA — APROBADO CON CAMBIOS
- Riesgo 1: `CERO.*` es destructivo si resetea. Cambio exigido: `CERO.sh --reset` pide confirmación
  escrita como el `.ps1`, y nadie lo corre contra la BD de trabajo en este ítem.
- Riesgo 2: `mv.json` lo lee el catálogo. Cambio exigido: solo cambiar `estado_desarrollo` y
  `actualizado`; `en_desarrollo` queda en `true`.
- Riesgo 3: las notas no deben llevar secretos ni credenciales de ejemplo reales.
- QA: `bash -n CERO.sh`, JSON válido y la suite Vitest sigue en verde (no se toca código).
- Arquitectura de software / solución: APROBADO ambos (sin cambios de arquitectura).

VEREDICTO: APROBADO CON CAMBIOS
