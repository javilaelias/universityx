-- =============================================================================
-- Migración 007: Jobs de transcodificación de video (media-service)
-- =============================================================================

CREATE TABLE IF NOT EXISTS media_jobs (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename   VARCHAR(500) NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'queued'
                         CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    error_message       TEXT,
    duration_seconds    INTEGER,
    hls_url             TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_jobs_uploader ON media_jobs(uploader_id);
