-- =============================================================================
-- Migración 005: Datos de Prueba Completos
-- Password de todos los usuarios: Test1234!
-- Hash bcrypt $2a$12$: c30Vrj0sc0tHs0Orm3PnKOGIhwUmuqw7R6Gqw/jyluw0BkpX7E10C
-- =============================================================================

-- ── Instructores adicionales ──────────────────────────────────────────────────
INSERT INTO users (id, email, full_name, role, is_active, created_at) VALUES
  ('00000000-0000-0000-0000-000000000002', 'ana.torres@universidadx.com',   'Dra. Ana Torres',      'instructor', true, NOW() - INTERVAL '180 days'),
  ('00000000-0000-0000-0000-000000000003', 'luis.garcia@universidadx.com',  'Ing. Luis García',     'instructor', true, NOW() - INTERVAL '150 days'),
  ('00000000-0000-0000-0000-000000000004', 'admin@universidadx.com',        'Administrador',        'admin',      true, NOW() - INTERVAL '365 days')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_credentials (user_id, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000002', '$2a$12$c30Vrj0sc0tHs0Orm3PnKOGIhwUmuqw7R6Gqw/jyluw0BkpX7E10C'),
  ('00000000-0000-0000-0000-000000000003', '$2a$12$c30Vrj0sc0tHs0Orm3PnKOGIhwUmuqw7R6Gqw/jyluw0BkpX7E10C'),
  ('00000000-0000-0000-0000-000000000004', '$2a$12$c30Vrj0sc0tHs0Orm3PnKOGIhwUmuqw7R6Gqw/jyluw0BkpX7E10C')
ON CONFLICT (user_id) DO NOTHING;

-- ── Estudiantes ───────────────────────────────────────────────────────────────
INSERT INTO users (id, email, full_name, role, is_active, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'sofia.ramirez@mail.com',    'Sofía Ramírez',      'student', true, NOW() - INTERVAL '90 days'),
  ('10000000-0000-0000-0000-000000000002', 'diego.morales@mail.com',    'Diego Morales',      'student', true, NOW() - INTERVAL '85 days'),
  ('10000000-0000-0000-0000-000000000003', 'valentina.cruz@mail.com',   'Valentina Cruz',     'student', true, NOW() - INTERVAL '80 days'),
  ('10000000-0000-0000-0000-000000000004', 'andres.lopez@mail.com',     'Andrés López',       'student', true, NOW() - INTERVAL '75 days'),
  ('10000000-0000-0000-0000-000000000005', 'isabella.ruiz@mail.com',    'Isabella Ruiz',      'student', true, NOW() - INTERVAL '70 days'),
  ('10000000-0000-0000-0000-000000000006', 'sebastian.vargas@mail.com', 'Sebastián Vargas',   'student', true, NOW() - INTERVAL '65 days'),
  ('10000000-0000-0000-0000-000000000007', 'camila.gutierrez@mail.com', 'Camila Gutiérrez',   'student', true, NOW() - INTERVAL '60 days'),
  ('10000000-0000-0000-0000-000000000008', 'mateo.hernandez@mail.com',  'Mateo Hernández',    'student', true, NOW() - INTERVAL '55 days'),
  ('10000000-0000-0000-0000-000000000009', 'emma.jimenez@mail.com',     'Emma Jiménez',       'student', true, NOW() - INTERVAL '50 days'),
  ('10000000-0000-0000-0000-000000000010', 'nicolas.rojas@mail.com',    'Nicolás Rojas',      'student', true, NOW() - INTERVAL '45 days'),
  ('10000000-0000-0000-0000-000000000011', 'lucia.mendez@mail.com',     'Lucía Méndez',       'student', true, NOW() - INTERVAL '40 days'),
  ('10000000-0000-0000-0000-000000000012', 'gabriel.santos@mail.com',   'Gabriel Santos',     'student', true, NOW() - INTERVAL '35 days')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_credentials (user_id, password_hash)
SELECT id, '$2a$12$c30Vrj0sc0tHs0Orm3PnKOGIhwUmuqw7R6Gqw/jyluw0BkpX7E10C'
FROM users
WHERE id BETWEEN '10000000-0000-0000-0000-000000000001' AND '10000000-0000-0000-0000-000000000012'
ON CONFLICT (user_id) DO NOTHING;

-- ── Cursos adicionales ────────────────────────────────────────────────────────
INSERT INTO courses (id, title, slug, description, instructor_id, level, is_published, tags, duration_hours) VALUES
  (
    'a0000000-0000-0000-0000-000000000002',
    'Desarrollo Web con React y TypeScript',
    'react-typescript',
    'Construye aplicaciones modernas con React 18, hooks avanzados, TypeScript y patrones de diseño profesionales.',
    '00000000-0000-0000-0000-000000000002',
    'intermediate',
    true,
    ARRAY['react','typescript','javascript','frontend'],
    28
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'Machine Learning con Python',
    'machine-learning-python',
    'Aprende los algoritmos fundamentales de ML: regresión, clasificación, clustering y redes neuronales con scikit-learn y TensorFlow.',
    '00000000-0000-0000-0000-000000000001',
    'advanced',
    true,
    ARRAY['python','machine-learning','ia','data-science'],
    40
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'Diseño UX/UI con Figma',
    'diseno-ux-ui-figma',
    'Domina el diseño de interfaces centrado en el usuario: investigación, wireframes, prototipos y sistemas de diseño con Figma.',
    '00000000-0000-0000-0000-000000000003',
    'beginner',
    true,
    ARRAY['ux','ui','figma','diseño','producto'],
    18
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'DevOps y Cloud con AWS',
    'devops-cloud-aws',
    'Infraestructura como código, CI/CD, contenedores Docker/Kubernetes y despliegue en AWS.',
    '00000000-0000-0000-0000-000000000002',
    'advanced',
    true,
    ARRAY['devops','aws','docker','kubernetes','cloud'],
    35
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Módulos del curso React/TS ─────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, position) VALUES
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'Fundamentos de TypeScript',   1),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'React Hooks Avanzados',       2),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'State Management con Zustand',3)
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, module_id, type, title, duration_seconds, position, is_free_preview) VALUES
  ('c0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000010','video',   'Tipos e Interfaces en TS',        900,  1, true),
  ('c0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000010','document','Guía: Genéricos y Utility Types', NULL, 2, false),
  ('c0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000010','quiz',    'Quiz: TypeScript Básico',         NULL, 3, false),
  ('c0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000011','video',   'useState y useEffect en profundidad',1200,1, true),
  ('c0000000-0000-0000-0000-000000000014','b0000000-0000-0000-0000-000000000011','video',   'useCallback, useMemo y useRef',   1080, 2, false),
  ('c0000000-0000-0000-0000-000000000015','b0000000-0000-0000-0000-000000000011','quiz',    'Quiz: Hooks Avanzados',           NULL, 3, false),
  ('c0000000-0000-0000-0000-000000000016','b0000000-0000-0000-0000-000000000012','video',   'Introducción a Zustand',           840, 1, false),
  ('c0000000-0000-0000-0000-000000000017','b0000000-0000-0000-0000-000000000012','document','Patrones de estado global',       NULL, 2, false)
ON CONFLICT DO NOTHING;

-- ── Módulos del curso ML ──────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, position) VALUES
  ('b0000000-0000-0000-0000-000000000020','a0000000-0000-0000-0000-000000000003','Python para Ciencia de Datos',   1),
  ('b0000000-0000-0000-0000-000000000021','a0000000-0000-0000-0000-000000000003','Regresión y Clasificación',       2),
  ('b0000000-0000-0000-0000-000000000022','a0000000-0000-0000-0000-000000000003','Redes Neuronales con TensorFlow', 3)
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, module_id, type, title, duration_seconds, position, is_free_preview) VALUES
  ('c0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000020','video',   'NumPy y Pandas esenciales',       1500, 1, true),
  ('c0000000-0000-0000-0000-000000000021','b0000000-0000-0000-0000-000000000020','video',   'Visualización con Matplotlib',    1200, 2, false),
  ('c0000000-0000-0000-0000-000000000022','b0000000-0000-0000-0000-000000000020','quiz',    'Quiz: Pandas',                    NULL, 3, false),
  ('c0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000021','video',   'Regresión Lineal desde cero',     1800, 1, false),
  ('c0000000-0000-0000-0000-000000000024','b0000000-0000-0000-0000-000000000021','video',   'Árboles de Decisión y Random Forest',1440,2,false),
  ('c0000000-0000-0000-0000-000000000025','b0000000-0000-0000-0000-000000000022','video',   'Redes Neuronales con Keras',      2100, 1, false)
ON CONFLICT DO NOTHING;

-- ── Módulos del curso UX/UI ───────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, position) VALUES
  ('b0000000-0000-0000-0000-000000000030','a0000000-0000-0000-0000-000000000004','Fundamentos de UX Research',    1),
  ('b0000000-0000-0000-0000-000000000031','a0000000-0000-0000-0000-000000000004','Diseño Visual y Componentes',   2)
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, module_id, type, title, duration_seconds, position, is_free_preview) VALUES
  ('c0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000030','video',   'Entrevistas de usuario y personas', 900, 1, true),
  ('c0000000-0000-0000-0000-000000000031','b0000000-0000-0000-0000-000000000030','document','Plantillas de UX Research',         NULL,2, false),
  ('c0000000-0000-0000-0000-000000000032','b0000000-0000-0000-0000-000000000031','video',   'Sistemas de diseño en Figma',       1320,1, false),
  ('c0000000-0000-0000-0000-000000000033','b0000000-0000-0000-0000-000000000031','quiz',    'Quiz: Componentes UI',              NULL,2, false)
ON CONFLICT DO NOTHING;

-- ── Módulos del curso DevOps ──────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, position) VALUES
  ('b0000000-0000-0000-0000-000000000040','a0000000-0000-0000-0000-000000000005','Docker y Contenedores',          1),
  ('b0000000-0000-0000-0000-000000000041','a0000000-0000-0000-0000-000000000005','CI/CD con GitHub Actions',       2)
ON CONFLICT DO NOTHING;

INSERT INTO content_items (id, module_id, type, title, duration_seconds, position, is_free_preview) VALUES
  ('c0000000-0000-0000-0000-000000000040','b0000000-0000-0000-0000-000000000040','video',   'Docker desde cero',               1500, 1, true),
  ('c0000000-0000-0000-0000-000000000041','b0000000-0000-0000-0000-000000000040','video',   'Docker Compose y redes',          1260, 2, false),
  ('c0000000-0000-0000-0000-000000000042','b0000000-0000-0000-0000-000000000041','video',   'Pipelines CI/CD con GH Actions',  1080, 1, false),
  ('c0000000-0000-0000-0000-000000000043','b0000000-0000-0000-0000-000000000041','document','Plantilla de workflow DevOps',    NULL, 2, false)
ON CONFLICT DO NOTHING;

-- ── Matrículas de estudiantes ─────────────────────────────────────────────────
INSERT INTO enrollments (user_id, course_id, enrolled_at, progress_pct, last_accessed_at) VALUES
  -- Sofía: BD (75%) + React (40%)
  ('10000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL '80 days', 75,  NOW()-INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002', NOW()-INTERVAL '30 days', 40,  NOW()-INTERVAL '3 hours'),
  -- Diego: BD (100%) + ML (20%)
  ('10000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL '75 days', 100, NOW()-INTERVAL '10 days'),
  ('10000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003', NOW()-INTERVAL '25 days', 20,  NOW()-INTERVAL '2 days'),
  -- Valentina: UX (90%) + React (60%)
  ('10000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004', NOW()-INTERVAL '70 days', 90,  NOW()-INTERVAL '5 hours'),
  ('10000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002', NOW()-INTERVAL '40 days', 60,  NOW()-INTERVAL '1 day'),
  -- Andrés: DevOps (50%) + ML (15%)
  ('10000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005', NOW()-INTERVAL '60 days', 50,  NOW()-INTERVAL '6 hours'),
  ('10000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003', NOW()-INTERVAL '20 days', 15,  NOW()-INTERVAL '4 days'),
  -- Isabella: BD (30%) + UX (70%)
  ('10000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL '65 days', 30,  NOW()-INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000004', NOW()-INTERVAL '35 days', 70,  NOW()-INTERVAL '8 hours'),
  -- Sebastián: React (85%) + DevOps (25%)
  ('10000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000002', NOW()-INTERVAL '55 days', 85,  NOW()-INTERVAL '12 hours'),
  ('10000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000005', NOW()-INTERVAL '15 days', 25,  NOW()-INTERVAL '1 day'),
  -- Camila: ML (55%) + BD (45%)
  ('10000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000003', NOW()-INTERVAL '50 days', 55,  NOW()-INTERVAL '3 hours'),
  ('10000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL '28 days', 45,  NOW()-INTERVAL '1 day'),
  -- Mateo: BD (10%) + React (5%)
  ('10000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL '40 days', 10,  NOW()-INTERVAL '7 days'),
  ('10000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000002', NOW()-INTERVAL '10 days', 5,   NOW()-INTERVAL '3 days'),
  -- Emma: UX (100%) + DevOps (80%)
  ('10000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000004', NOW()-INTERVAL '45 days', 100, NOW()-INTERVAL '5 days'),
  ('10000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000005', NOW()-INTERVAL '22 days', 80,  NOW()-INTERVAL '6 hours'),
  -- Nicolás: ML (35%)
  ('10000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000003', NOW()-INTERVAL '38 days', 35,  NOW()-INTERVAL '4 hours'),
  -- Lucía: React (95%) + BD (65%)
  ('10000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000002', NOW()-INTERVAL '32 days', 95,  NOW()-INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL '18 days', 65,  NOW()-INTERVAL '1 day'),
  -- Gabriel: DevOps (60%)
  ('10000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000005', NOW()-INTERVAL '28 days', 60,  NOW()-INTERVAL '5 hours')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Marcar completados los de 100%
UPDATE enrollments SET completed_at = NOW() - INTERVAL '5 days'
WHERE progress_pct = 100;

-- ── Progreso por contenido ────────────────────────────────────────────────────
INSERT INTO progress (user_id, content_item_id, completed, progress_seconds, score, attempts) VALUES
  -- Sofía en curso BD
  ('10000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',true, 720,  null, 0),
  ('10000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002',true, 0,    null, 0),
  ('10000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000003',true, 0,    82,   2),
  -- Sofía en curso React
  ('10000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000010',true, 900,  null, 0),
  ('10000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000011',true, 0,    null, 0),
  ('10000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000013',false,540,  null, 0),
  -- Diego en BD (completado)
  ('10000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001',true, 720,  null, 0),
  ('10000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002',true, 0,    null, 0),
  ('10000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003',true, 0,    95,   1),
  -- Valentina en React
  ('10000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000010',true, 900,  null, 0),
  ('10000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000013',true, 1200, null, 0),
  ('10000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000014',true, 1080, null, 0),
  ('10000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000015',true, 0,    78,   1),
  ('10000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000016',false,420,  null, 0),
  -- Sebastián en React (85%)
  ('10000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000010',true, 900,  null, 0),
  ('10000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000011',true, 0,    null, 0),
  ('10000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000012',true, 0,    91,   1),
  ('10000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000013',true, 1200, null, 0),
  ('10000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000014',true, 1080, null, 0)
ON CONFLICT (user_id, content_item_id) DO NOTHING;

-- ── Notificaciones ────────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, body, is_read, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001','badge_earned',    'Nueva insignia obtenida',                    '¡Completaste el módulo Introducción a SQL!', true,  NOW()-INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000001','task_due',        'Entrega próxima: Quiz Hooks Avanzados',      'Tienes 3 días para completar el quiz.',      false, NOW()-INTERVAL '1 hour'),
  ('10000000-0000-0000-0000-000000000001','live_session',    'Sesión en vivo mañana',                      'Repaso de React 18 con la Dra. Ana Torres.',  false, NOW()-INTERVAL '3 hours'),
  ('10000000-0000-0000-0000-000000000002','badge_earned',    'Curso completado: Fundamentos de BD',        '¡Felicidades! Obtuviste tu certificado.',    true,  NOW()-INTERVAL '10 days'),
  ('10000000-0000-0000-0000-000000000002','course_update',   'Nuevo módulo disponible: SQL Avanzado',      'Ya puedes acceder al módulo 2.',             false, NOW()-INTERVAL '7 days'),
  ('10000000-0000-0000-0000-000000000003','task_due',        'Quiz pendiente: TypeScript Básico',          'Complétalo antes del viernes.',              false, NOW()-INTERVAL '5 hours'),
  ('10000000-0000-0000-0000-000000000006','badge_earned',    'Excelente puntuación en quiz',               'Obtuviste 91/100 en Hooks Avanzados.',       false, NOW()-INTERVAL '1 day'),
  ('10000000-0000-0000-0000-000000000009','badge_earned',    'Curso completado: Diseño UX/UI',             '¡Felicidades! Descarga tu certificado.',     true,  NOW()-INTERVAL '5 days'),
  ('10000000-0000-0000-0000-000000000011','task_due',        'Solo falta 1 ítem para completar React',     'Estás al 95%, ¡casi listo!',                 false, NOW()-INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- ── Tickets de soporte ────────────────────────────────────────────────────────
INSERT INTO support_tickets (id, user_id, category, subject, description, status, priority, created_at) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'technical',
    'El video del módulo 2 no carga',
    'Al intentar reproducir el video "SQL Avanzado — JOINs" aparece un error de reproducción.',
    'in_progress', 'high', NOW()-INTERVAL '3 days'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000004',
    'academic',
    'Consulta sobre calificación del quiz',
    'Respondí correctamente la pregunta 3 pero me marcó como incorrecta.',
    'open', 'medium', NOW()-INTERVAL '1 day'
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000009',
    'certificate',
    'Certificado no aparece en mi perfil',
    'Completé el curso de UX/UI hace 5 días pero el certificado no aparece en mi perfil.',
    'resolved', 'medium', NOW()-INTERVAL '4 days'
  )
ON CONFLICT DO NOTHING;

INSERT INTO ticket_messages (ticket_id, author_id, body, created_at) VALUES
  ('f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'El error ocurre en Chrome y Firefox. El video anterior del mismo módulo sí funciona.', NOW()-INTERVAL '3 days'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
   'Gracias por reportarlo. Estamos revisando el CDN. Te notificamos en 24 horas.', NOW()-INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009',
   'El sistema tarda hasta 24 horas en generar el certificado. Ya está disponible en tu perfil.', NOW()-INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ── Sesión en vivo próxima ────────────────────────────────────────────────────
INSERT INTO live_sessions (id, course_id, title, description, instructor_id, scheduled_at, duration_minutes, status, max_attendees) VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'Sesión de repaso: React 18 y Concurrent Features',
    'Resolución de dudas y demostración de las nuevas características de React 18.',
    '00000000-0000-0000-0000-000000000002',
    NOW() + INTERVAL '2 days',
    90, 'scheduled', 50
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'Workshop: Construyendo un modelo de clasificación real',
    'Práctica guiada: dataset real, limpieza de datos, entrenamiento y evaluación.',
    '00000000-0000-0000-0000-000000000001',
    NOW() + INTERVAL '5 days',
    120, 'scheduled', 30
  )
ON CONFLICT DO NOTHING;
