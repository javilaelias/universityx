-- =============================================================================
-- Migración 004: Seed Data de Desarrollo
-- =============================================================================

-- Instructor de prueba (password: Test1234!)
INSERT INTO users (id, email, full_name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001',
        'instructor@universidadx.com', 'Dr. Carlos Méndez', 'instructor', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_credentials (user_id, password_hash)
VALUES ('00000000-0000-0000-0000-000000000001',
        '$2a$12$c30Vrj0sc0tHs0Orm3PnKOGIhwUmuqw7R6Gqw/jyluw0BkpX7E10C')
ON CONFLICT (user_id) DO NOTHING;

-- Curso 1: Fundamentos de Bases de Datos
INSERT INTO courses (id, title, slug, description, instructor_id, level, is_published, tags)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Fundamentos de Bases de Datos',
  'fundamentos-bases-datos',
  'Aprende SQL, diseño relacional, indexing y optimización de consultas desde cero.',
  '00000000-0000-0000-0000-000000000001',
  'beginner',
  true,
  ARRAY['sql','postgresql','diseño','backend']
) ON CONFLICT (slug) DO NOTHING;

-- Módulo 1
INSERT INTO modules (id, course_id, title, position)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
        'Introducción a SQL', 1)
ON CONFLICT DO NOTHING;

-- Contenidos del módulo 1
INSERT INTO content_items (id, module_id, type, title, duration_seconds, position, is_free_preview)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'video', '¿Qué es una base de datos?', 720, 1, true),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'document', 'Guía de referencia SQL', NULL, 2, false),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'quiz', 'Quiz: Conceptos básicos', NULL, 3, false)
ON CONFLICT DO NOTHING;

-- Módulo 2 (drip: disponible 7 días después)
INSERT INTO modules (id, course_id, title, position, release_date)
VALUES ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
        'SQL Avanzado — JOINs e Índices', 2,
        NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Quiz con preguntas
INSERT INTO quizzes (content_item_id, passing_score, max_attempts)
VALUES ('c0000000-0000-0000-0000-000000000003', 70, 3)
ON CONFLICT (content_item_id) DO NOTHING;

DO $$
DECLARE
  qid UUID;
  q1  UUID := gen_random_uuid();
  q2  UUID := gen_random_uuid();
BEGIN
  SELECT id INTO qid FROM quizzes WHERE content_item_id = 'c0000000-0000-0000-0000-000000000003';

  INSERT INTO quiz_questions (id, quiz_id, text, position, points) VALUES
    (q1, qid, '¿Qué significa SQL?', 1, 1),
    (q2, qid, '¿Cuál sentencia se usa para consultar datos?', 2, 1)
  ON CONFLICT DO NOTHING;

  INSERT INTO quiz_options (question_id, text, is_correct, position) VALUES
    (q1, 'Structured Query Language', true,  1),
    (q1, 'Simple Query Logic',        false, 2),
    (q1, 'Sequential Query List',     false, 3),
    (q2, 'SELECT',  true,  1),
    (q2, 'FETCH',   false, 2),
    (q2, 'COLLECT', false, 3)
  ON CONFLICT DO NOTHING;
END $$;
