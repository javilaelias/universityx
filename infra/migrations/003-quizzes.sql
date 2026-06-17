-- =============================================================================
-- Migración 003: Tablas de Quizzes
-- =============================================================================

CREATE TABLE IF NOT EXISTS quizzes (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id  UUID        UNIQUE NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    passing_score    DECIMAL(5,2) DEFAULT 60,
    max_attempts     INTEGER     DEFAULT 3,
    shuffle_questions BOOLEAN    DEFAULT false,
    time_limit_sec   INTEGER,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id     UUID    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    explanation TEXT,
    position    INTEGER NOT NULL,
    points      DECIMAL(5,2) DEFAULT 1,
    UNIQUE(quiz_id, position)
);

CREATE TABLE IF NOT EXISTS quiz_options (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID    NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT false,
    position    INTEGER NOT NULL,
    UNIQUE(question_id, position)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_item_id UUID        NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    answers         JSONB       NOT NULL DEFAULT '{}',
    score           DECIMAL(5,2),
    passed          BOOLEAN,
    submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user     ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_content  ON quiz_attempts(content_item_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz    ON quiz_questions(quiz_id);
