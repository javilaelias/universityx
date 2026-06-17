-- =============================================================================
-- Migración 006: Configuración SSO por institución
-- =============================================================================

CREATE TABLE IF NOT EXISTS sso_configs (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    institution     VARCHAR(100) NOT NULL UNIQUE,
    display_name    VARCHAR(255),
    email_domain    VARCHAR(255) UNIQUE,        -- detección automática por dominio
    protocol        VARCHAR(10)  NOT NULL DEFAULT 'saml',
    -- SAML (HTTP-Redirect + POST binding)
    saml_entry_point TEXT,
    saml_issuer      TEXT,
    saml_cert        TEXT,                      -- certificado PEM del IdP
    -- OIDC personalizado (además de Google/Microsoft globales)
    oidc_discovery_url  TEXT,
    oidc_client_id      TEXT,
    oidc_client_secret  TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sso_configs_domain ON sso_configs(email_domain)
    WHERE email_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sso_configs_active ON sso_configs(institution, is_active);
