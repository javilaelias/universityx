# UX Flow — Estudiante con Mala Conexión (App Android)

**Escenario:** Ana, estudiante de ingeniería en zona rural, tiene señal móvil intermitente.
Necesita completar el Módulo 3 de "Fundamentos de Bases de Datos" y sincronizar su avance.

---

## Fase 1: Preparación con Wi-Fi (Casa / Biblioteca)

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1 — Inicio de sesión biométrico                       │
│                                                             │
│  Ana abre la app → el sistema detecta que tiene sesión      │
│  guardada en Keystore seguro.                               │
│                                                             │
│  [Pantalla]                                                 │
│  ┌─────────────────────┐                                    │
│  │  Universidad X      │                                    │
│  │  Bienvenida, Ana    │                                    │
│  │                     │                                    │
│  │  ◉ Huella dactilar  │ ← BiometricPrompt nativo Android  │
│  │    para ingresar    │                                    │
│  │                     │                                    │
│  │  [Usar contraseña]  │                                    │
│  └─────────────────────┘                                    │
│                                                             │
│  ✓ JWT renovado en background usando Refresh Token          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PASO 2 — Dashboard detecta contenido descargable           │
│                                                             │
│  El sistema compara la lista de módulos del servidor        │
│  con el contenido en caché local (SQLite).                  │
│                                                             │
│  [Banner proactivo en Dashboard]                            │
│  ┌─────────────────────────────────┐                        │
│  │ 📥 Módulo 3 disponible para     │                        │
│  │    descarga (245 MB)            │                        │
│  │    [Descargar ahora]            │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PASO 3 — Selección y descarga de contenido                 │
│                                                             │
│  Ana navega a "Mis Cursos" → "Fund. Bases de Datos"         │
│  → Módulo 3 → [Descargar para ver sin conexión]             │
│                                                             │
│  [Pantalla de descarga]                                     │
│  ┌─────────────────────────────────┐                        │
│  │ Módulo 3: SQL Avanzado          │                        │
│  │                                 │                        │
│  │ ▓▓▓▓▓▓▓▓░░░░░░░  60%           │                        │
│  │ Descargando: Video 3.2 (18MB)  │                        │
│  │                                 │                        │
│  │ ✓ Video 3.1 — Introducción      │                        │
│  │ ⟳ Video 3.2 — JOINs (18 MB)   │                        │
│  │ ○ Lectura 3.3 — Índices (2 MB) │                        │
│  │ ○ Quiz 3.4 (cargado)           │                        │
│  │                                 │                        │
│  │ Válido por 30 días              │                        │
│  └─────────────────────────────────┘                        │
│                                                             │
│  Backend: WorkManager encola tareas de descarga segmentada  │
│  Los archivos se guardan en almacenamiento cifrado (AES-256)│
│  SQLite local registra: content_id, ruta, checksum, expiry  │
└─────────────────────────────────────────────────────────────┘
```

---

## Fase 2: Consumo Offline (Sin Conexión)

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 4 — App detecta pérdida de conectividad               │
│                                                             │
│  ConnectivityManager lanza callback de red caída.           │
│  El estado global de la app cambia a OFFLINE_MODE.          │
│                                                             │
│  [Indicador persistente en la app]                          │
│  ┌─────────────────────────────────┐                        │
│  │  🔴 Sin conexión — Modo Offline │ ← barra superior       │
│  └─────────────────────────────────┘                        │
│                                                             │
│  Los botones de contenido no descargado aparecen            │
│  deshabilitados con ícono 🔒 "Requiere conexión".           │
│  El contenido descargado sigue 100% accesible.              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PASO 5 — Reproducción de video offline                     │
│                                                             │
│  Ana toca "Video 3.2 — JOINs en SQL"                        │
│  → El reproductor lee el archivo local (ExoPlayer)          │
│  → La interfaz es idéntica al modo online                   │
│                                                             │
│  Cada 30 segundos, el progreso se guarda en SQLite:         │
│  { content_id, user_id, position_sec, is_offline: true }   │
│                                                             │
│  Al cerrar el video:                                        │
│  • progress.last_position_sec = 847                         │
│  • Se genera un evento en offline_sync_queue con            │
│    idempotency_key único (UUID v4)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PASO 6 — Realización del Quiz offline                      │
│                                                             │
│  Ana completa el Quiz 3.4 (10 preguntas de opción múltiple) │
│  → Las preguntas fueron descargadas con el módulo           │
│  → Al enviar, la respuesta NO se manda al servidor          │
│  → Se almacena en SQLite:                                   │
│                                                             │
│  offline_sync_queue.events = [{                             │
│    idempotency_key: "uuid-xyz-789",                         │
│    type: "quiz_submit",                                     │
│    payload: {                                               │
│      content_item_id: "uuid-quiz-34",                       │
│      answers: { "q1": "b", "q2": "c", ... },               │
│      score: 85,                                             │
│      duration_sec: 420                                      │
│    },                                                       │
│    occurred_at: "2026-06-17T14:30:00Z",                     │
│    synced: false                                            │
│  }]                                                         │
│                                                             │
│  [UI muestra resultado local inmediato]                     │
│  ┌─────────────────────────┐                                │
│  │  ✓ Quiz completado      │                                │
│  │  Tu puntuación: 85/100  │                                │
│  │  Se sincronizará cuando │                                │
│  │  recuperes conexión 📶  │                                │
│  └─────────────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Fase 3: Reconexión y Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 7 — App detecta red disponible                        │
│                                                             │
│  ConnectivityManager: red restaurada.                       │
│  WorkManager activa SyncWorker (tarea en background).       │
│                                                             │
│  [Indicador en UI]                                          │
│  ┌─────────────────────────────────┐                        │
│  │  🟡 Sincronizando progreso...   │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PASO 8 — Sincronización con el servidor                    │
│                                                             │
│  App → POST /api/sync/batch                                 │
│  {                                                          │
│    "device_id": "android-uuid-abc",                         │
│    "events": [                                              │
│      { idempotency_key, type: "video_progress", ... },      │
│      { idempotency_key, type: "quiz_submit",    ... }       │
│    ]                                                        │
│  }                                                          │
│                                                             │
│  sync-service:                                              │
│  1. Verifica idempotency_key → descarta duplicados          │
│  2. Aplica eventos en orden cronológico                     │
│  3. Recalcula progress_pct del curso en PostgreSQL          │
│  4. Actualiza perfil de aprendizaje en MongoDB              │
│  5. Evalúa si completó el módulo → emite badge si aplica    │
│                                                             │
│  Respuesta: 200 OK                                          │
│  { "synced": 5, "conflicts": [], "badges_earned": [] }      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PASO 9 — Confirmación y estado actualizado                 │
│                                                             │
│  [Notificación push (FCM)]                                  │
│  ┌──────────────────────────────┐                           │
│  │  Universidad X               │                           │
│  │  ✓ Progreso sincronizado     │                           │
│  │  Módulo 3 completado al 80%  │                           │
│  └──────────────────────────────┘                           │
│                                                             │
│  [Dashboard actualizado]                                    │
│  ┌─────────────────────────────┐                            │
│  │  🟢 En línea                │                            │
│  │  Fund. Bases de Datos  80% │                            │
│  │  ▓▓▓▓▓▓▓▓░░ Módulo 3 ✓    │                            │
│  │  Próximo: Módulo 4          │                            │
│  └─────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumen del Journey (Estado de la App por Fase)

| Fase | Estado Red | Funcionalidades Disponibles |
|------|-----------|----------------------------|
| **1. Preparación** | Wi-Fi | Login biométrico, descarga de módulos, preview contenido |
| **2. Offline** | Sin conexión | Videos y docs descargados, quizzes locales, lectura de PDFs |
| **3. Transición** | Señal débil | WorkManager espera red estable antes de sincronizar |
| **4. Sincronización** | Conexión restaurada | Batch sync, resolución de conflictos, notificación push |

## Decisiones de UX Clave

- **Diseño "Offline-First":** la app funciona sin conexión como estado primario, no como modo degradado.
- **Feedback inmediato:** el resultado del quiz se muestra al instante (calculado localmente), aunque la nota oficial se confirme tras la sync.
- **Idempotency keys:** garantizan que un mismo evento nunca se procese dos veces aunque la sync se interrumpa y reintente.
- **Expiración de descargas (30 días):** balance entre accesibilidad y derechos de contenido; WorkManager limpia archivos expirados en background.
- **Indicadores de estado siempre visibles:** el color del banner (🟢🟡🔴) comunica el estado sin interrumpir el flujo de estudio.
