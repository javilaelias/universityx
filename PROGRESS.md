# Universidad X — Registro de Progreso

> **Proyecto:** Plataforma EdTech (LMS) — Web (Next.js) + Android (Kotlin)
> **Última actualización:** 2026-06-17

---

## ✅ COMPLETADO

### Fase 0 — Fundamentos y Arquitectura
- [x] **Arquitectura del sistema** — Diagrama Mermaid con 3 capas, 8 microservicios, servicios externos (`docs/01-architecture.md`)
- [x] **Flujos de autenticación SSO** — Sequence diagram SAML 2.0 / OIDC
- [x] **Flujo de sincronización offline** — Sequence diagram WorkManager → sync-service
- [x] **Esquema de base de datos PostgreSQL** — 12 tablas con types, FK, índices (`docs/02-database-schema.sql`)
- [x] **Esquemas MongoDB** — learning_profiles, offline_sync_queue, chatbot_sessions (`infra/mongo-init.js`)
- [x] **UX Flow offline** — Journey completo en 3 fases con diagramas ASCII (`docs/03-ux-flow-offline.md`)

### Fase 1 — Infraestructura Local (Docker)
- [x] **docker-compose.yml** — PostgreSQL 16, MongoDB 7, Redis 7, pgAdmin 4, Mongo Express
- [x] **Variables de entorno** — `.env` con todas las conexiones locales
- [x] **Scripts de inicio de BD** — `infra/mongo-init.js`, `infra/pgadmin-servers.json`
- [x] **MCP Servers configurados** — `.mcp.json` con postgres, context7, memory, filesystem
- [x] **CERO.ps1** — Script maestro de arranque con documentación de infraestructura completa
- [x] **START.bat** — Lanzador rápido con subcomandos (stop/status/web/reset/logs)

### Fase 2 — Código Base Frontend Web
- [x] **Tipos TypeScript** — `web/src/types/dashboard.ts` (DashboardData, LiveSession, Task, Progress...)
- [x] **Hook useDashboard** — `web/src/hooks/useDashboard.ts` (fetch + estado online/offline)
- [x] **IntelligentDashboard** — `web/src/components/dashboard/IntelligentDashboard.tsx`
  - SyncBadge (🟢🟡🔴 indicador de conexión)
  - LiveSessionCard (sesiones en vivo)
  - ProgressCard (progreso por curso)
  - TaskCard (tareas pendientes con urgencia)
  - AIRecommendationCard (sugerencias de IA)
  - Skeleton de carga / dark mode / responsive grid

### Fase 2 — Código Base Android
- [x] **BiometricAuthManager.kt** — Gestión biométrica con Android Keystore, AES-256, manejo de KeyInvalidated
- [x] **LoginActivity.kt** — UI de login con flujo SSO + contraseña + biométrico
- [x] **LoginViewModel.kt** — Estados (Idle/Loading/Success/Error/NeedsBiometricSetup) con Kotlin Flow
- [x] **build.gradle.kts** — Dependencias Android: Biometric, WorkManager, ExoPlayer, Retrofit, Coil

---

## 🔄 EN PROGRESO

*(auth-service completado — siguiente: lms-service)*

---

## ⏳ PENDIENTE

### Fase 3 — Backend Microservicios
- [x] **auth-service** — Node.js/Express + JWT + Refresh Tokens + Redis + Rate Limiting ✅
  - POST /auth/register · POST /auth/login · POST /auth/refresh
  - POST /auth/logout · GET /auth/me · POST /auth/logout-all
  - Migración 002: tabla user_credentials aplicada en PostgreSQL
  - TypeScript strict, Zod validation, bcrypt, token rotation
  - SSO endpoints stub (pendiente passport-saml en V2)
  - Probado end-to-end: register → login → /me ✅
- [x] **lms-service** — Node.js/Express + TypeScript + Repository Pattern ✅
  - GET /api/courses · GET /api/courses/:id (con módulos, drip content)
  - POST/DELETE /api/enrollments · GET /api/enrollments
  - POST /api/progress · GET /api/courses/:id/progress
  - GET /api/quizzes/:id · POST /api/quizzes/:id/submit (auto-calificado)
  - GET /api/dashboard (agregado: cursos + sesiones + tareas + IA stub)
  - Migración 003: quizzes, quiz_questions, quiz_options, quiz_attempts
  - Migración 004: seed data (curso, módulos, contenido, quiz con preguntas)
  - Caché Redis por curso y dashboard (TTL configurable)
  - Probado end-to-end: login → matrícula → quiz 100% → dashboard 33% ✅
- [x] **notification-service** `:4003` — BullMQ + Redis + in-app + email console ✅
  - Cola `notifications` con retry exponencial (3 intentos)
  - Worker: guarda en tabla `notifications` + envía email (console en dev)
  - Eventos: enrollment.confirmed, quiz.passed/failed, ticket.created/reply, live_session.reminder
  - REST: POST /trigger · GET / · GET /count · PUT /read-all · PUT /:id/read
  - Probado E2E: trigger → queue → worker → DB → count=2 ✅
- [x] **helpdesk-service** `:4004` — tickets CRUD + thread de mensajes ✅
  - GET/POST /api/tickets · GET /api/tickets/:id
  - POST /api/tickets/:id/messages · PUT /api/tickets/:id/status
  - Al crear ticket → notifica via notification-service (fire-and-forget)
  - Al responder staff → notifica al usuario propietario
  - Probado E2E: crear ticket → agregar mensaje → listar ✅
- [x] **Web — Página /tickets** — lista con estado/prioridad/categoría + paginación ✅
- [x] **Web — Página /tickets/[id]** — thread de mensajes con burbujas ✅
- [x] **Web — NotificationBell** — bell con badge de conteo, dropdown con lista, marcar todo leído ✅
- [x] **Navbar** — agregado Soporte + NotificationBell ✅
- [x] **sync-service** `:4005` — reconciliación offline con idempotency keys ✅
  - POST /sync/batch — acepta hasta 200 eventos por llamada
  - Tipos: progress_update · content_complete · quiz_submit
  - Idempotency: misma key → skipped (nunca duplica)
  - Conflicto de video: GREATEST(progress_seconds) — nunca retrocede
  - Conflicto de quiz: guarda el MAYOR score obtenido
  - Recalcula enrollment progress_pct de forma asíncrona
  - Probado: 4 eventos (3 applied, 1 skipped), replay (0 applied, 1 skipped) ✅
- [x] **Docker Compose completo** — todos los servicios containerizados ✅
  - Dockerfiles multi-stage para: auth · lms · notification · helpdesk · sync · ai · credentials
  - Next.js standalone build con web/Dockerfile
  - docker-compose.yml: 13 servicios, healthchecks, depends_on, ux_network
  - Redis config fijada: maxmemory-policy noeviction (correcto para BullMQ)
  - ai-service y credentials-service agregados con sus dependencias correctas
- [ ] **lms-service** — Cursos, módulos, contenido, drip release, quizzes
  - CRUD de cursos y módulos
  - Endpoint de descarga de contenido (URLs firmadas S3/GCS)
  - Lógica de drip content (liberar módulos por fecha)
- [ ] **sync-service** — Reconciliación offline con idempotency keys
  - POST /sync/batch — recibe array de eventos offline
  - Resolución de conflictos (last-write-wins para progreso, preservar ambos para quizzes)
- [ ] **notification-service** — FCM Push + Email + BullMQ queues
  - Worker de BullMQ para envíos programados
  - Integración con Firebase Cloud Messaging
- [ ] **helpdesk-service** — Tickets + Chatbot con RAG
  - CRUD de tickets de soporte
  - Chatbot con contexto de la plataforma (OpenAI / Claude)
- [x] **ai-service** `:4006` — Perfiles adaptativos MongoDB + recomendaciones (Python/FastAPI) ✅
  - Rule-based recommender: quiz score, video progress, idle nudge, new content
  - POST /profiles/{userId}/activity · GET /profiles/{userId}
  - GET /recommendations/{userId} — persiste en MongoDB, lee de PostgreSQL
  - MongoDB upsert via aggregation pipeline ($ifNull) — esquema validado
- [x] **credentials-service** `:4007` — Open Badges 3.0 (Node.js/TypeScript) ✅
  - POST /credentials (emite badge si progress_pct=100)
  - GET /credentials (lista badges del usuario con verifyUrl)
  - GET /credentials/:id (verificación pública)
  - buildOpenBadge: @context, VerifiableCredential, OpenBadgeCredential 3.0
- [ ] **media-service** — Transcoding HLS + streaming adaptativo
  - Upload de videos → FFmpeg → HLS segmentado
  - URLs de CDN con expiración

### Fase 4 — API Routes Next.js (Web)
- [x] `/api/auth/[...nextauth]` — NextAuth.js con CredentialsProvider → auth-service ✅
- [x] `/api/dashboard/[userId]` — Proxy → lms-service + mapeo snake_case→camelCase ✅
- [x] `/api/courses` — Listado con filtros search/level/page ✅
- [x] `/api/courses/[id]` — Detalle de curso con módulos ✅
- [x] `/api/enrollments` — Matriculación (GET + POST) ✅
- [x] `/api/progress` — Actualizar progreso de estudiante ✅
- [x] `/api/notifications` — Proxy → notification-service ✅ (NotificationBell existente)
- [x] `/api/recommendations/[userId]` — Proxy → ai-service ✅
- [x] `/api/credentials` — GET lista + POST emite → credentials-service ✅
- [x] `/api/credentials/[id]` — Verificación pública de badge ✅
- [x] `/api/sync` — Proxy → sync-service (POST batch) ✅
- [x] **Dashboard** — aiRecommendations pobladas con datos reales del ai-service ✅

### Fase 5 — Páginas Web (Next.js App Router)
- [x] `/` — Redirige a /dashboard o /login según sesión ✅
- [x] `/login` — Página de autenticación con email/password + SSO stub ✅
- [x] `/dashboard` — IntelligentDashboard con datos reales del backend ✅
- [x] `/courses` — Catálogo con búsqueda, filtro por nivel y paginación ✅
- [x] `/courses/[id]` — Detalle con módulos, contenidos y matriculación ✅
- [x] `/profile` — Perfil con Open Badges 3.0 (listar + reclamar credenciales) ✅
- [x] **NextAuth.js** — JWT strategy, sesión persistida, middleware protege rutas ✅
- [x] **Navbar** — Con navegación activa, logout y nombre del usuario ✅
- [x] **Dark mode** — Variables CSS + Tailwind dark: ready ✅
- [x] **TypeScript limpio** — 0 errores en `tsc --noEmit` ✅
- [x] **Next.js dev server** — Corriendo en http://localhost:3000 ✅
- [x] `/courses/[id]/quiz/[quizId]` — Cuestionario interactivo completo ✅
  - State machine: loading → answering → confirming → submitting → results
  - Navegación libre entre preguntas con dots navigator
  - Timer de tiempo transcurrido
  - Pantalla de resultados con score, pass/fail, correcto/incorrecto
  - Retry hasta max_attempts
  - Enlace desde course detail cuando el ítem es tipo 'quiz'
- [ ] `/tickets` — Sistema de soporte

### Fase 6 — Módulos Android
- [x] **ProgressTracker** — Room SQLite offline (ProgressEntity, SyncQueueEntity) ✅
  - recordVideoProgress, markContentComplete, recordQuizResult
  - Encola SyncQueueEntity con idempotency keys para sync posterior
- [x] **SyncWorker** — WorkManager → sync-service `:4005` ✅
  - Batch hasta 200 eventos, retry exponencial, prune de 7 días
  - periodicRequest (15min) + immediateRequest on demand
- [x] **OfflineDownloadManager** — WorkManager descarga segmentada ✅
  - DownloadWorker: streaming byte-by-byte con progreso, retry x2
  - enqueue/cancel/delete, observeDownloads por curso
- [x] **VideoPlayerActivity** — ExoPlayer Media3 (local file + HLS) ✅
  - Detecta si hay archivo local, fallback a URL remota
  - Guarda progreso cada 5s, marca complete al finalizar
  - Full-screen immersive mode, rotate support
- [x] **CourseListScreen** — Jetpack Compose ✅
  - Search debounced, filtros de nivel (chips), pull-to-refresh
  - CourseCard con thumbnail (Coil), barra de progreso, matricularse
- [x] **CourseDownloadScreen** — Compose con progreso por ítem ✅
  - Muestra estado PENDING/DOWNLOADING/COMPLETED/FAILED/PAUSED
  - Enqueue/cancel/delete por ítem individual
- [x] **FcmService** — Notificaciones push FCM ✅
  - onMessageReceived → NotificationCompat con canal
  - onNewToken hook (pendiente: enviar al notification-service)
- [x] **NavGraph + MainActivity** — Compose Navigation ✅
  - Login → Courses → Downloads, startDestination según token
- [x] **TokenManager** — EncryptedSharedPreferences AES-256 ✅

### Fase 7 — Infraestructura y DevOps
- [x] **Dockerfiles** — Multi-stage build en los 8 servicios + web ✅
- [x] **CI/CD Pipeline** — GitHub Actions completo ✅
  - `ci.yml`: web typecheck+build · 6 servicios Node.js typecheck · Python flake8+mypy · Docker build matrix · Android assemble debug
  - `cd.yml`: push images a GHCR · deploy a staging via SSH · health check post-deploy
  - `release.yml`: versionado semántico manual (patch/minor/major) + GitHub Release
  - `dependabot.yml`: npm (web + 6 servicios) · pip · gradle · github-actions
  - `.gitignore` raíz · `.env.example` documentando todas las variables
  - `docker-compose.staging.yml`: overrides con imágenes pre-built de GHCR
  - PR template con checklist de seguridad
- [ ] **API Gateway** — Kong o configuración de AWS APIGW
- [ ] **Kubernetes manifests** — Deployments, Services, Ingress, HPA
- [ ] **Helm charts** — Para despliegue en GKE/EKS
- [ ] **Terraform / CDK** — Infraestructura como código en AWS/GCP

### Fase 8 — Tests
- [ ] **Frontend:** Jest + React Testing Library + Playwright (E2E)
- [ ] **Backend:** Jest/Vitest para unit tests, Supertest para integración
- [ ] **Android:** JUnit4 + Espresso para UI tests
- [ ] **Carga:** k6 / Artillery para pruebas de rendimiento

### Fase 9 — Funcionalidades Avanzadas
- [ ] **Sesiones en vivo** — Integración Zoom SDK o BigBlueButton
- [ ] **SSO Institucional** — Configuración SAML 2.0 con universidad
- [ ] **Modo oscuro** — Dark mode completo en web y Android
- [ ] **Accesibilidad** — WCAG 2.1 AA compliance
- [ ] **PWA** — Service Worker para web offline
- [ ] **Analytics** — Mixpanel / PostHog para métricas de aprendizaje

---

## 📋 DECISIONES DE ARQUITECTURA TOMADAS

| Decisión | Elección | Razón |
|----------|----------|-------|
| Framework web | Next.js 14 (App Router) | SSR, SEO, Server Components, excelente DX |
| Android | Kotlin Nativo | Máximo rendimiento, acceso total a APIs del SO |
| Biometría Android | BiometricPrompt + Android Keystore | Seguro, nativo, soporta huella + facial |
| Offline-first | WorkManager + SQLite | Soporte robusto en background, sobrevive reinicios |
| Sync strategy | Idempotency keys + batch | Previene duplicados, tolerante a fallos de red |
| DB principal | PostgreSQL 16 | ACID, tipado fuerte, índices parciales para offline |
| DB IA/Logs | MongoDB | Esquema flexible para perfiles adaptativos |
| Cache/Queues | Redis | BullMQ para notificaciones, cache de sesiones |
| Videos | HLS adaptativo + CDN | Calidad adaptativa, descarga por segmentos |
| Credenciales | Open Badges 3.0 + Polygon | Estándar portable + verificabilidad blockchain |

---

## 🔗 SERVICIOS LOCALES (tras ejecutar CERO.ps1 / START.bat)

| Servicio | URL / Host | Credenciales |
|---------|-----------|-------------|
| PostgreSQL | `localhost:5432` | `ux_admin` / `ux_dev_pass_2024` |
| MongoDB | `localhost:27017` | `ux_admin` / `ux_dev_pass_2024` |
| Redis | `localhost:6379` | pass: `ux_dev_pass_2024` |
| pgAdmin | http://localhost:5050 | `admin@universidadx.local` / `admin1234` |
| Mongo Express | http://localhost:8081 | `admin` / `admin1234` |
| Next.js Dev | http://localhost:3000 | *(tras `cd web && npm run dev`)* |

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
D:\UniversidadX\
├── .env                          ← Variables de entorno locales
├── .mcp.json                     ← MCP servers para Claude Code
├── docker-compose.yml            ← Infraestructura Docker completa
├── CERO.ps1                      ← Script maestro de arranque (PowerShell)
├── START.bat                     ← Lanzador rápido (Windows)
├── PROGRESS.md                   ← Este archivo
│
├── docs/
│   ├── 01-architecture.md        ← Diagramas Mermaid del sistema
│   ├── 02-database-schema.sql    ← Esquema PostgreSQL (12 tablas)
│   └── 03-ux-flow-offline.md     ← Journey estudiante offline
│
├── infra/
│   ├── mongo-init.js             ← Init MongoDB (colecciones + índices)
│   └── pgadmin-servers.json      ← Conexión pgAdmin preconfigurada
│
├── web/                          ← Frontend Next.js
│   ├── package.json
│   └── src/
│       ├── types/dashboard.ts    ← Tipos TypeScript del dashboard
│       ├── hooks/useDashboard.ts ← Hook de datos del dashboard
│       └── components/dashboard/
│           └── IntelligentDashboard.tsx ← Dashboard principal
│
└── android/                      ← App Android (Kotlin)
    └── app/
        ├── build.gradle.kts
        └── src/main/java/com/universidadx/
            ├── auth/BiometricAuthManager.kt
            └── ui/login/
                ├── LoginActivity.kt
                └── LoginViewModel.kt
```
