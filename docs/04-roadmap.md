# Universidad X — Roadmap: MVP → V2 → V3

> **Principio guía:** cada versión debe ser desplegable, usable y generadora de valor real por sí sola.
> El MVP resuelve el dolor más urgente; cada versión siguiente amplía el valor sin romper lo anterior.

---

## Resumen Ejecutivo

| Versión | Nombre | Duración estimada | Objetivo principal |
|---------|--------|------------------|--------------------|
| **MVP** | "Aprende" | 8 semanas | Estudiante puede matricularse, ver cursos y seguir su progreso |
| **V2** | "Aprende sin límites" | +10 semanas | Offline total en Android, IA básica, sesiones en vivo, notificaciones |
| **V3** | "Certifica y crece" | +10 semanas | Credenciales blockchain, IA adaptativa completa, chatbot, analytics |

---

## MVP — "Aprende" (Semanas 1–8)

### Objetivo
Un estudiante puede: **registrarse → matricularse en un curso → consumir el contenido → ver su progreso → pedir soporte**.

### Funcionalidades incluidas

#### Auth & Usuarios
- [x] `POST /auth/register` — registro con email + contraseña
- [x] `POST /auth/login` — login con JWT + Refresh Token (Redis)
- [x] `POST /auth/refresh` — rotación de tokens
- [x] `POST /auth/logout` — invalidar sesión
- [x] `GET  /auth/me` — perfil del usuario autenticado
- [x] SSO stub (SAML 2.0 / OIDC) — flujo completo con proveedor real
- [x] Página de login web (Next.js)

#### Cursos y Contenido (LMS)
- [x] `GET  /courses` — catálogo de cursos publicados
- [x] `GET  /courses/:id` — detalle de curso con módulos
- [x] `POST /enrollments` — matricularse en un curso
- [x] `GET  /courses/:id/modules/:moduleId` — módulo con contenido
- [x] Reproductor de video (HLS via CDN)
- [x] Visor de PDFs/documentos
- [x] `GET  /courses/:id/progress` — progreso del estudiante

#### Dashboard Web
- [x] Componente `IntelligentDashboard`
- [x] API route `/api/dashboard/[userId]` que alimenta el componente
- [x] Cursos en progreso con porcentaje real
- [x] Tareas pendientes (quizzes, asignaciones)

#### Quizzes Básicos
- [x] `GET  /quizzes/:id` — preguntas del quiz
- [x] `POST /quizzes/:id/submit` — enviar respuestas + calificación

#### Soporte (Helpdesk Básico)
- [x] `POST /tickets` — crear ticket
- [x] `GET  /tickets` — listar mis tickets
- [x] `PATCH /tickets/:id` — responder / actualizar ticket
- [x] Página de soporte web

#### Infraestructura
- [x] `auth-service` completo (Node.js + Express + TypeScript)
- [x] `lms-service` (CRUD de cursos, módulos, progreso)
- [x] Dockerfiles para cada servicio
- [x] docker-compose completo con todos los servicios
- [x] Variables de entorno validadas con Zod

### Lo que NO entra en MVP
- Modo offline Android
- IA adaptativa
- Sesiones en vivo
- Notificaciones push
- Badges / credenciales
- Chatbot
- Biometría Android

### Criterios de éxito MVP
- Un estudiante externo puede completar el registro sin ayuda
- Un curso completo con video + quiz es consumible end-to-end
- El progreso persiste entre sesiones
- Un ticket de soporte llega al panel de administración
- Tiempo de carga del dashboard < 2 segundos

---

## V2 — "Aprende sin límites" (Semanas 9–18)

### Objetivo
Eliminar la dependencia de conectividad. Un estudiante con señal inestable puede **descargar cursos → completarlos offline → sincronizar al reconectarse** y recibir notificaciones push en Android.

### Funcionalidades incluidas

#### Offline Android (bloque más complejo)
- [ ] `OfflineDownloadManager` — WorkManager + descarga segmentada por ítem
- [ ] SQLite local — `progress`, `offline_events`, `downloaded_content`
- [ ] `SyncWorker` — detección de red + batch sync al servidor
- [ ] `sync-service` backend — idempotency keys + resolución de conflictos
- [ ] Expiración de descargas (30 días) + limpieza automática
- [ ] Indicador de estado offline/syncing/online en UI Android
- [ ] Quiz offline con resultado local inmediato

#### Autenticación Biométrica (Android)
- [ ] `BiometricAuthManager` (ya creado ✓)
- [ ] Endpoint `POST /auth/biometric/register` — registrar clave pública
- [ ] Endpoint `POST /auth/biometric/challenge` + `POST /auth/biometric/verify`
- [ ] `LoginActivity` con flujo biométrico completo (ya creado ✓)

#### Notificaciones Push
- [ ] `notification-service` — BullMQ + FCM
- [ ] Integración FCM en app Android
- [ ] Push por: tarea próxima a vencer, sesión en vivo próxima, progreso semanal
- [ ] Centro de notificaciones en web (bell icon)

#### Sesiones en Vivo
- [ ] Integración Zoom SDK o BigBlueButton embed
- [ ] `GET  /live-sessions` — próximas sesiones del curso
- [ ] Recordatorios automáticos 15 min antes (push + email)
- [ ] Grabación automática disponible en curso

#### IA Adaptativa — Fase 1
- [ ] `ai-service` básico — analiza historial de progreso
- [ ] Sección "Recomendado para ti" en dashboard (componente ya creado ✓)
- [ ] Algoritmo simple: cursos con bajo progreso → sugerir contenido relacionado
- [ ] Perfil de aprendizaje en MongoDB (pace, preferred_types, peak_hours)

#### Panel Instructor
- [x] CRUD completo de cursos propios (crear, editar, publicar, eliminar)
- [x] Gestión de módulos y contenido inline (accordion editor)
- [x] Validación de propiedad en todos los endpoints de mutación
- [x] Navbar con enlace "Panel Instructor" visible solo para instructor/admin

#### Badges y Certificados
- [x] `credentials-service` — emisión de badges Open Badges 3.0
- [x] Badge al completar un curso al 100%
- [x] Perfil del estudiante con badges públicos
- [x] Certificado PDF descargable (pdfkit, A4 landscape)
- [x] Página pública de verificación `/verify/[id]` (sin auth)
- [ ] Integración Credly / Acreditta

#### Tests Automatizados
- [x] Vitest + supertest: auth-service (9 tests), lms-service (9), credentials-service (7)
- [x] CI GitHub Actions: job `unit-tests` bloqueante para docker-build
- [ ] Playwright E2E web
- [ ] JUnit Android

#### Mejoras Web
- [x] Modo oscuro (Dark Mode) completo
- [x] i18n ES/EN
- [x] Búsqueda de cursos
- [x] Filtros por nivel
- [ ] **PWA — Service Worker (siguiente)** ← próximo
- [ ] Búsqueda avanzada con pg_trgm

#### Documentación
- [x] Manual de usuario (docs/05-manual-usuario.md) — estudiante, instructor, admin

### Criterios de éxito V2
- Estudiante completa un módulo offline y el progreso se sincroniza sin pérdida
- Push notification llega < 5 segundos tras el evento
- Biometría funciona en Android 8+ sin contraseña adicional
- Badge emitido es verificable en Credly

---

## V3 — "Certifica y crece" (Semanas 19–28)

### Objetivo
Convertir la plataforma en un ecosistema completo: **credenciales verificables en blockchain**, chatbot 24/7 con RAG, análisis pedagógico profundo y preparación para escalar a múltiples universidades.

### Funcionalidades incluidas

#### Credenciales Blockchain
- [ ] Smart contract en Polygon (ERC-1155 o ERC-721)
- [ ] `credentials-service` con `ethers.js` — mint de certificados on-chain
- [ ] QR de verificación público (sin login)
- [ ] Wallet del estudiante (MetaMask / WalletConnect)
- [ ] PDF de certificado con hash blockchain embebido

#### IA Adaptativa — Fase 2
- [ ] Modelo de predicción de abandono (churn prediction)
- [ ] Rutas personalizadas completas (secuencia de módulos adaptada)
- [ ] Análisis de desempeño por tema con NLP en respuestas de quizzes
- [ ] Dashboard del instructor con insights de aprendizaje del grupo

#### Chatbot con RAG (Helpdesk Virtual)
- [ ] `helpdesk-service` con LangChain / Claude API
- [ ] Base de conocimiento: FAQs, reglamentos, procesos administrativos
- [ ] El bot escala a ticket humano si no resuelve en 2 turnos
- [ ] Integración en web (widget flotante) y Android (pantalla dedicada)
- [ ] Historial de conversaciones en MongoDB

#### Analytics Avanzado
- [ ] Dashboard de analytics para instructor: completion rate, avg score, drop-off points
- [ ] Dashboard admin: revenue, active users, NPS
- [ ] Reportes exportables (PDF / CSV)
- [ ] Integración PostHog o Mixpanel para eventos de aprendizaje

#### Multi-tenant (varias universidades)
- [ ] Schema PostgreSQL con `tenant_id` en todas las tablas
- [ ] Subdominio por institución: `tec.universidad-x.com`, `unam.universidad-x.com`
- [ ] Panel de super-admin para gestión de tenants
- [ ] SSO independiente por tenant

#### DevOps & Escalabilidad
- [ ] Kubernetes manifests (Deployments, HPA, Ingress)
- [ ] Helm charts para cada microservicio
- [ ] GitHub Actions: lint → test → build → push ECR → deploy
- [ ] Terraform para infraestructura AWS/GCP
- [ ] Observabilidad: Prometheus + Grafana + OpenTelemetry

#### PWA Offline Web
- [ ] Service Worker completo para web
- [ ] Cache de contenido con Workbox
- [ ] Sync background en navegador (Background Sync API)

### Criterios de éxito V3
- Certificado verificable en blockchain en < 30 segundos
- Chatbot resuelve > 70% de consultas sin intervención humana
- Sistema soporta 10,000 usuarios concurrentes
- Plataforma multi-tenant: nueva universidad en < 1 hora

---

## Dependencias entre versiones

```
MVP                     V2                      V3
─────────────────       ─────────────────       ─────────────────
auth-service      ──→   biometric endpoints ──→  multi-tenant
lms-service       ──→   offline sync        ──→  analytics
progress tracking ──→   ai-service fase 1   ──→  ai-service fase 2
tickets básicos   ──→   chatbot fase 1      ──→  chatbot RAG completo
                        badges básicos      ──→  blockchain creds
                        FCM                 ──→  push avanzado
```

---

## Stack por servicio (referencia rápida)

| Servicio | Tech | Puerto Dev |
|----------|------|-----------|
| `auth-service` | Node.js + Express + TypeScript | 4001 |
| `lms-service` | Node.js + Express + TypeScript | 4002 |
| `sync-service` | Node.js + Express + TypeScript | 4003 |
| `notification-service` | Node.js + BullMQ + FCM | 4004 |
| `helpdesk-service` | Node.js + Express + Claude API | 4005 |
| `ai-service` | Python + FastAPI | 4006 |
| `credentials-service` | Node.js + ethers.js | 4007 |
| `media-service` | Node.js + FFmpeg | 4008 |
| Next.js Web | Next.js 14 | 3000 |

---

## Estado actual (2026-06-17)

### Completado
- ✅ MVP completo (auth, lms, helpdesk, sync, notification, ai, credentials)
- ✅ Panel Instructor (CRUD cursos/módulos/contenido + publish)
- ✅ Certificados PDF + página de verificación pública Open Badges 3.0
- ✅ Tests Vitest en 3 servicios críticos + CI unit-tests job
- ✅ Servidor de pruebas RHEL 10 en 10.118.67.55:8080
- ✅ Manual de usuario (docs/05-manual-usuario.md)

### Pendiente — orden de prioridad
1. **PWA** — `next-pwa` o Service Worker manual; manifest, offline shell, cache de assets
2. **media-service** — FFmpeg + HLS transcoding para subida de videos
3. **Playwright E2E** — flujos críticos web (login, enroll, complete, download cert)
4. **JUnit Android** — tests unitarios del SDK de sync y repositorios
5. **Kubernetes + Helm** — manifests para producción
6. **Integración Credly / Acreditta** — export de badges externos
