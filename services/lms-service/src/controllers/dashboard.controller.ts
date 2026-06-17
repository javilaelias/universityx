import { Request, Response, NextFunction } from 'express';
import { query } from '../db/postgres';
import { cacheGet, cacheSet } from '../db/redis';

// ── GET /dashboard ────────────────────────────────────────────────────────────
// Agrega en una sola llamada: cursos en progreso, sesiones de hoy,
// tareas pendientes y recomendaciones IA (stub para MVP).
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId   = req.user!.sub;
    const cacheKey = `dashboard:${userId}`;

    const cached = await cacheGet(cacheKey);
    if (cached) { res.json(cached); return; }

    const [userRow, courseProgress, liveSessions, pendingTasks] = await Promise.all([
      // Datos del estudiante
      query<{ full_name: string; avatar_url: string | null; streak_days: number; total_badges: number }>(
        `SELECT full_name, avatar_url,
                0 AS streak_days,
                (SELECT COUNT(*)::int FROM user_badges WHERE user_id = $1) AS total_badges
         FROM   users WHERE id = $1`,
        [userId]
      ),

      // Cursos en progreso
      query<{
        course_id: string; title: string; thumbnail_url: string | null;
        progress_pct: number; level: string;
        next_content_title: string | null; next_content_type: string | null;
        completed_modules: number; total_modules: number;
        last_accessed_at: Date | null;
      }>(
        `SELECT e.course_id, c.title, c.thumbnail_url, e.progress_pct, c.level,
                e.last_accessed_at,
                (
                  SELECT ci.title FROM content_items ci
                  JOIN modules m ON m.id = ci.module_id
                  LEFT JOIN progress p ON p.content_item_id = ci.id AND p.user_id = e.user_id
                  WHERE m.course_id = e.course_id
                    AND (m.release_date IS NULL OR m.release_date <= NOW())
                    AND (p.completed IS NULL OR p.completed = false)
                  ORDER BY m.position, ci.position LIMIT 1
                ) AS next_content_title,
                (
                  SELECT ci.type FROM content_items ci
                  JOIN modules m ON m.id = ci.module_id
                  LEFT JOIN progress p ON p.content_item_id = ci.id AND p.user_id = e.user_id
                  WHERE m.course_id = e.course_id
                    AND (m.release_date IS NULL OR m.release_date <= NOW())
                    AND (p.completed IS NULL OR p.completed = false)
                  ORDER BY m.position, ci.position LIMIT 1
                ) AS next_content_type,
                (
                  SELECT COUNT(DISTINCT m.id)::int FROM modules m
                  JOIN content_items ci ON ci.module_id = m.id
                  JOIN progress p ON p.content_item_id = ci.id
                  WHERE m.course_id = e.course_id AND p.user_id = e.user_id
                    AND p.completed = true
                ) AS completed_modules,
                (SELECT COUNT(*)::int FROM modules WHERE course_id = e.course_id) AS total_modules
         FROM   enrollments e
         JOIN   courses c ON c.id = e.course_id
         WHERE  e.user_id = $1 AND e.progress_pct < 100
         ORDER  BY e.last_accessed_at DESC NULLS LAST
         LIMIT  6`,
        [userId]
      ),

      // Sesiones en vivo hoy
      query<{
        id: string; title: string; course_name: string;
        instructor_name: string; scheduled_at: Date;
        duration_minutes: number; meeting_url: string;
        attendee_count: number;
      }>(
        `SELECT ls.id, ls.title,
                c.title AS course_name,
                u.full_name AS instructor_name,
                ls.scheduled_at, ls.duration_minutes, ls.meeting_url,
                (SELECT COUNT(*)::int FROM session_attendance sa WHERE sa.session_id = ls.id) AS attendee_count
         FROM   live_sessions ls
         JOIN   courses c ON c.id = ls.course_id
         JOIN   enrollments e ON e.course_id = c.id AND e.user_id = $1
         LEFT   JOIN users u ON u.id = ls.instructor_id
         WHERE  ls.scheduled_at::date = CURRENT_DATE
           AND  ls.status IN ('scheduled','live')
         ORDER  BY ls.scheduled_at ASC`,
        [userId]
      ),

      // Tareas pendientes (quizzes sin completar + próximas fechas)
      query<{
        id: string; title: string; course_name: string;
        due_date: Date | null; type: string; estimated_minutes: number | null;
      }>(
        `SELECT ci.id, ci.title,
                c.title AS course_name,
                NULL::timestamptz AS due_date,
                ci.type,
                ci.duration_seconds / 60 AS estimated_minutes
         FROM   content_items ci
         JOIN   modules m ON m.id = ci.module_id
         JOIN   courses c ON c.id = m.course_id
         JOIN   enrollments e ON e.course_id = c.id AND e.user_id = $1
         LEFT   JOIN progress p ON p.content_item_id = ci.id AND p.user_id = $1
         WHERE  ci.type IN ('quiz','assignment')
           AND  (m.release_date IS NULL OR m.release_date <= NOW())
           AND  (p.completed IS NULL OR p.completed = false)
         ORDER  BY m.position, ci.position
         LIMIT  5`,
        [userId]
      ),
    ]);

    const student = userRow.rows[0];
    if (!student) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

    const dashboard = {
      student: {
        id:          userId,
        full_name:   student.full_name,
        avatar_url:  student.avatar_url,
        streak_days: student.streak_days,
        total_badges:student.total_badges,
      },
      course_progress:     courseProgress.rows,
      live_sessions_today: liveSessions.rows,
      pending_tasks:       pendingTasks.rows,
      // IA adaptativa: stub para MVP; será real en V2
      ai_recommendations: [],
      sync_status:        'synced',
      pending_sync_count:  0,
    };

    await cacheSet(cacheKey, dashboard, 60); // TTL corto: 1 minuto
    res.json(dashboard);
  } catch (err) { next(err); }
}
