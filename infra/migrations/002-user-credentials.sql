-- =============================================================================
-- Migración 002: Tabla de credenciales de usuario
-- =============================================================================
-- Separamos el password_hash de la tabla users para:
--   1. Evitar exponer el hash en queries generales de usuario
--   2. Facilitar la eliminación de credenciales sin borrar el usuario
--   3. Soportar múltiples métodos de autenticación por usuario
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_credentials (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user
  ON user_credentials(user_id);
