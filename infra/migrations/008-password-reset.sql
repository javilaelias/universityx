-- =============================================================================
-- Migración 008: Tokens de recuperación de contraseña
-- =============================================================================
-- Solo se guarda el SHA-256 del token (el token en claro viaja únicamente en el
-- correo). Un solo uso (used_at) y expiración (expires_at). Idempotente: en una
-- BD ya creada se aplica a mano (ver docs/06-despliegue.md).
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  CHAR(64)    NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
  ON password_reset_tokens(user_id);
