import { query } from '../db/postgres';
import type { Enrollment } from '../types/lms.types';

export async function findEnrollment(userId: string, courseId: string) {
  const { rows } = await query<Enrollment>(
    'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  return rows[0] ?? null;
}

export async function findUserEnrollments(userId: string) {
  const { rows } = await query<
    Enrollment & {
      title: string; thumbnail_url: string | null;
      level: string; instructor_name: string | null;
      total_items: number; completed_items: number;
      next_content_id: string | null; next_content_title: string | null;
    }
  >(
    `SELECT e.*,
            c.title, c.thumbnail_url, c.level,
            u.full_name AS instructor_name,
            (
              SELECT COUNT(*)::int FROM content_items ci
              JOIN modules m ON m.id = ci.module_id
              WHERE m.course_id = c.id
            ) AS total_items,
            (
              SELECT COUNT(*)::int FROM progress p
              JOIN content_items ci ON ci.id = p.content_item_id
              JOIN modules m ON m.id = ci.module_id
              WHERE m.course_id = c.id AND p.user_id = e.user_id AND p.completed = true
            ) AS completed_items,
            (
              SELECT ci.id FROM content_items ci
              JOIN modules m ON m.id = ci.module_id
              LEFT JOIN progress p ON p.content_item_id = ci.id AND p.user_id = e.user_id
              WHERE m.course_id = c.id
                AND (release_date IS NULL OR release_date <= NOW())
                AND (p.completed IS NULL OR p.completed = false)
              ORDER BY m.position, ci.position
              LIMIT 1
            ) AS next_content_id,
            (
              SELECT ci.title FROM content_items ci
              JOIN modules m ON m.id = ci.module_id
              LEFT JOIN progress p ON p.content_item_id = ci.id AND p.user_id = e.user_id
              WHERE m.course_id = c.id
                AND (release_date IS NULL OR release_date <= NOW())
                AND (p.completed IS NULL OR p.completed = false)
              ORDER BY m.position, ci.position
              LIMIT 1
            ) AS next_content_title
     FROM   enrollments e
     JOIN   courses c ON c.id = e.course_id
     LEFT   JOIN users u ON u.id = c.instructor_id
     WHERE  e.user_id = $1
     ORDER  BY e.last_accessed_at DESC NULLS LAST`,
    [userId]
  );
  return rows;
}

export async function enroll(userId: string, courseId: string) {
  const { rows } = await query<Enrollment>(
    `INSERT INTO enrollments (user_id, course_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, course_id) DO UPDATE SET last_accessed_at = NOW()
     RETURNING *`,
    [userId, courseId]
  );
  return rows[0];
}

export async function unenroll(userId: string, courseId: string) {
  const { rowCount } = await query(
    'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  return (rowCount ?? 0) > 0;
}

export async function updateProgressPct(userId: string, courseId: string) {
  await query(
    `UPDATE enrollments
     SET    progress_pct = (
              SELECT CASE WHEN total = 0 THEN 0
                     ELSE ROUND((done::numeric / total) * 100, 2) END
              FROM (
                SELECT COUNT(*)::int AS total,
                       COUNT(p.id) FILTER (WHERE p.completed = true)::int AS done
                FROM   content_items ci
                JOIN   modules m ON m.id = ci.module_id
                LEFT   JOIN progress p ON p.content_item_id = ci.id AND p.user_id = $1
                WHERE  m.course_id = $2
              ) sub
            ),
            last_accessed_at = NOW()
     WHERE  user_id = $1 AND course_id = $2`,
    [userId, courseId]
  );
}
