-- =============================================================================
-- Migración 009: Tokens de dispositivo para push (FCM)
-- =============================================================================
-- Un token pertenece a un solo usuario: si otra cuenta inicia sesión en el mismo
-- equipo, el token se reasigna (upsert por token). Idempotente: en una BD ya
-- creada se aplica a mano (ver docs/06-despliegue.md).
-- =============================================================================

CREATE TABLE IF NOT EXISTS device_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT        NOT NULL UNIQUE,
    platform    VARCHAR(16) NOT NULL DEFAULT 'android',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
