-- =============================================================================
-- Universidad X — Esquema de Base de Datos (PostgreSQL)
-- =============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- búsqueda de texto

-- -----------------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- -----------------------------------------------------------------------------
CREATE TYPE user_role        AS ENUM ('student', 'instructor', 'admin', 'support');
CREATE TYPE course_level     AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE content_type     AS ENUM ('video', 'document', 'quiz', 'assignment', 'live_session');
CREATE TYPE download_status  AS ENUM ('pending', 'downloading', 'completed', 'failed', 'expired');
CREATE TYPE ticket_category  AS ENUM ('payment', 'technical', 'academic', 'certificate', 'administrative');
CREATE TYPE ticket_status    AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
CREATE TYPE ticket_priority  AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE session_status   AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE badge_source     AS ENUM ('internal', 'credly', 'acreditta', 'blockchain');

-- -----------------------------------------------------------------------------
-- USUARIOS (Estudiantes, Instructores, Admins)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   VARCHAR(255) UNIQUE NOT NULL,
    institutional_email     VARCHAR(255) UNIQUE,
    full_name               VARCHAR(255) NOT NULL,
    role                    user_role   NOT NULL DEFAULT 'student',
    avatar_url              TEXT,
    biometric_public_key    TEXT,                   -- clave pública del dispositivo Android
    sso_provider            VARCHAR(100),           -- 'saml' | 'google' | 'microsoft'
    sso_subject_id          VARCHAR(500),           -- subject_id del proveedor SSO
    is_active               BOOLEAN     DEFAULT true,
    last_login_at           TIMESTAMPTZ,
    timezone                VARCHAR(100) DEFAULT 'America/Mexico_City',
    language                VARCHAR(10)  DEFAULT 'es',
    dark_mode_enabled       BOOLEAN     DEFAULT false,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- CURSOS
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(500) NOT NULL,
    slug                VARCHAR(500) UNIQUE NOT NULL,
    description         TEXT,
    instructor_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    thumbnail_url       TEXT,
    trailer_url         TEXT,
    level               course_level DEFAULT 'beginner',
    duration_hours      DECIMAL(6,2),
    language            VARCHAR(10)  DEFAULT 'es',
    tags                TEXT[],
    is_published        BOOLEAN     DEFAULT false,
    drip_enabled        BOOLEAN     DEFAULT false,   -- liberación gradual de contenido
    drip_interval_days  INTEGER     DEFAULT 7,
    max_offline_days    INTEGER     DEFAULT 30,      -- días máx. de acceso offline
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- MÓDULOS DE CURSO
-- -----------------------------------------------------------------------------
CREATE TABLE modules (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    position        INTEGER     NOT NULL,
    release_date    TIMESTAMPTZ,                     -- para drip content
    is_downloadable BOOLEAN     DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, position)
);

-- -----------------------------------------------------------------------------
-- ÍTEMS DE CONTENIDO (videos, documentos, quizzes, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE content_items (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id           UUID        NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    type                content_type NOT NULL,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    content_url         TEXT,                        -- URL CDN (HLS para video)
    duration_seconds    INTEGER,
    position            INTEGER     NOT NULL,
    offline_size_mb     DECIMAL(10,2),
    is_free_preview     BOOLEAN     DEFAULT false,
    transcript_url      TEXT,                        -- para accesibilidad
    subtitle_urls       JSONB,                       -- {"es": "url", "en": "url"}
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, position)
);

-- -----------------------------------------------------------------------------
-- MATRÍCULAS
-- -----------------------------------------------------------------------------
CREATE TABLE enrollments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id           UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at         TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    progress_pct        DECIMAL(5,2) DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    last_accessed_at    TIMESTAMPTZ,
    certificate_issued  BOOLEAN     DEFAULT false,
    UNIQUE(user_id, course_id)
);

-- -----------------------------------------------------------------------------
-- PROGRESO POR CONTENIDO (online + offline sync)
-- -----------------------------------------------------------------------------
CREATE TABLE progress (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_item_id     UUID        NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    completed           BOOLEAN     DEFAULT false,
    progress_seconds    INTEGER     DEFAULT 0,       -- para video: segundos vistos
    score               DECIMAL(5,2),               -- para quizzes: 0-100
    attempts            INTEGER     DEFAULT 0,
    completed_at        TIMESTAMPTZ,
    last_position_sec   INTEGER     DEFAULT 0,       -- para reanudar video
    idempotency_key     UUID        UNIQUE,          -- evita duplicados en sync
    is_offline_pending  BOOLEAN     DEFAULT false,   -- pendiente de sincronizar
    synced_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_item_id)
);

-- -----------------------------------------------------------------------------
-- DESCARGAS OFFLINE
-- -----------------------------------------------------------------------------
CREATE TABLE offline_downloads (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_item_id     UUID        NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    downloaded_at       TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    status              download_status DEFAULT 'pending',
    file_size_mb        DECIMAL(10,2),
    checksum_sha256     VARCHAR(64),                 -- para verificar integridad
    UNIQUE(user_id, content_item_id)
);

-- -----------------------------------------------------------------------------
-- SESIONES EN VIVO
-- -----------------------------------------------------------------------------
CREATE TABLE live_sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id           UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    instructor_id       UUID        REFERENCES users(id),
    scheduled_at        TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER,
    meeting_url         TEXT,
    recording_url       TEXT,
    status              session_status DEFAULT 'scheduled',
    max_attendees       INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de asistencia a sesiones
CREATE TABLE session_attendance (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ,
    left_at         TIMESTAMPTZ,
    duration_min    INTEGER,
    UNIQUE(session_id, user_id)
);

-- -----------------------------------------------------------------------------
-- INSIGNIAS Y MICROCREDENCIALES
-- -----------------------------------------------------------------------------
CREATE TABLE badges (
    id                          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(255) NOT NULL,
    description                 TEXT,
    image_url                   TEXT,
    course_id                   UUID    REFERENCES courses(id),
    source                      badge_source DEFAULT 'internal',
    blockchain_contract_address TEXT,
    credly_badge_template_id    TEXT,
    criteria                    JSONB,              -- condiciones para obtenerla
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id            UUID    NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    issued_at           TIMESTAMPTZ DEFAULT NOW(),
    blockchain_tx_hash  TEXT,
    blockchain_token_id TEXT,
    credly_badge_url    TEXT,
    is_public           BOOLEAN DEFAULT true,
    UNIQUE(user_id, badge_id)
);

-- -----------------------------------------------------------------------------
-- TICKETS DE SOPORTE (Helpdesk)
-- -----------------------------------------------------------------------------
CREATE TABLE support_tickets (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        ticket_category NOT NULL,
    subject         VARCHAR(500)    NOT NULL,
    description     TEXT            NOT NULL,
    status          ticket_status   DEFAULT 'open',
    priority        ticket_priority DEFAULT 'medium',
    assigned_to     UUID            REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    satisfaction    SMALLINT        CHECK (satisfaction BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

CREATE TABLE ticket_messages (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID    NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_id   UUID    NOT NULL REFERENCES users(id),
    body        TEXT    NOT NULL,
    is_internal BOOLEAN DEFAULT false,              -- nota interna de soporte
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- NOTIFICACIONES
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(100) NOT NULL,              -- 'task_due', 'live_session', 'badge_earned'
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    data        JSONB,                              -- payload extra (e.g. course_id)
    is_read     BOOLEAN DEFAULT false,
    sent_push   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================================================

-- Usuarios
CREATE INDEX idx_users_email              ON users(email);
CREATE INDEX idx_users_institutional      ON users(institutional_email);
CREATE INDEX idx_users_sso                ON users(sso_provider, sso_subject_id);

-- Matrículas
CREATE INDEX idx_enrollments_user         ON enrollments(user_id);
CREATE INDEX idx_enrollments_course       ON enrollments(course_id);

-- Progreso
CREATE INDEX idx_progress_user            ON progress(user_id);
CREATE INDEX idx_progress_offline         ON progress(user_id) WHERE is_offline_pending = true;

-- Descargas offline
CREATE INDEX idx_offline_user             ON offline_downloads(user_id);
CREATE INDEX idx_offline_expires          ON offline_downloads(expires_at) WHERE status = 'completed';

-- Tickets
CREATE INDEX idx_tickets_user             ON support_tickets(user_id);
CREATE INDEX idx_tickets_status           ON support_tickets(status, priority);
CREATE INDEX idx_tickets_assigned         ON support_tickets(assigned_to) WHERE status != 'closed';

-- Sesiones live
CREATE INDEX idx_live_sessions_scheduled  ON live_sessions(scheduled_at) WHERE status = 'scheduled';

-- Notificaciones no leídas
CREATE INDEX idx_notifications_unread     ON notifications(user_id) WHERE is_read = false;

-- =============================================================================
-- COLECCIÓN MONGODB — Perfil de Aprendizaje Adaptativo (esquema de referencia)
-- =============================================================================
/*
Collection: learning_profiles

{
  "_id":        ObjectId,
  "user_id":    String,           // UUID del usuario en PostgreSQL
  "updated_at": ISODate,

  "profile": {
    "pace":               "slow" | "medium" | "fast",
    "preferred_types":    ["video", "document"],  // tipos de contenido favoritos
    "peak_hours":         [8, 9, 20, 21],         // horas con más actividad (UTC)
    "avg_session_min":    25,
    "completion_rate":    0.73                    // histórico de tasa de finalización
  },

  "strengths":  ["programacion", "diseño_ux"],
  "weaknesses": ["estadistica", "bases_de_datos"],

  "recommendations": [
    {
      "content_item_id":  String,
      "course_id":        String,
      "reason":           "Bajo rendimiento detectado en módulo de SQL",
      "confidence":       0.87,
      "generated_at":     ISODate,
      "clicked":          false
    }
  ],

  "activity_log": [
    {
      "action":           "video_watched" | "quiz_submitted" | "content_downloaded",
      "content_item_id":  String,
      "duration_sec":     1240,
      "score":            null,
      "timestamp":        ISODate,
      "was_offline":      false
    }
  ]
}

Collection: offline_sync_queue

{
  "_id":              ObjectId,
  "user_id":          String,
  "device_id":        String,
  "events":           [
    {
      "idempotency_key":  String,       // UUID único por evento
      "type":             "progress_update" | "quiz_submit" | "content_complete",
      "payload":          { ... },
      "occurred_at":      ISODate,
      "synced":           false
    }
  ],
  "last_sync_at":     ISODate,
  "created_at":       ISODate
}
*/
