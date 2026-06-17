import { query } from '../db/postgres';
import type { Progress } from '../types/lms.types';
import { randomUUID } from 'crypto';

export async function findProgress(userId: string, contentItemId: string) {
  const { rows } = await query<Progress>(
    'SELECT * FROM progress WHERE user_id = $1 AND content_item_id = $2',
    [userId, contentItemId]
  );
  return rows[0] ?? null;
}

export async function findCourseProgress(userId: string, courseId: string) {
  const { rows } = await query<Progress & { content_title: string; content_type: string; module_title: string }>(
    `SELECT p.*, ci.title AS content_title, ci.type AS content_type, m.title AS module_title
     FROM   progress p
     JOIN   content_items ci ON ci.id = p.content_item_id
     JOIN   modules m ON m.id = ci.module_id
     WHERE  m.course_id = $1 AND p.user_id = $2
     ORDER  BY m.position, ci.position`,
    [courseId, userId]
  );
  return rows;
}

export async function upsertProgress(data: {
  userId:          string;
  contentItemId:   string;
  progressSeconds?: number;
  lastPositionSec?: number;
  completed?:      boolean;
  score?:          number;
  idempotencyKey?: string;
}) {
  const { rows } = await query<Progress>(
    `INSERT INTO progress
       (user_id, content_item_id, progress_seconds, last_position_sec,
        completed, score, completed_at, idempotency_key, synced_at)
     VALUES ($1, $2, $3, $4, $5, $6,
             CASE WHEN $5 THEN NOW() ELSE NULL END,
             $7, NOW())
     ON CONFLICT (user_id, content_item_id) DO UPDATE SET
       progress_seconds  = GREATEST(progress.progress_seconds, EXCLUDED.progress_seconds),
       last_position_sec = EXCLUDED.last_position_sec,
       completed         = CASE WHEN EXCLUDED.completed THEN true ELSE progress.completed END,
       score             = COALESCE(EXCLUDED.score, progress.score),
       completed_at      = CASE WHEN EXCLUDED.completed AND progress.completed_at IS NULL
                                THEN NOW() ELSE progress.completed_at END,
       attempts          = progress.attempts + CASE WHEN EXCLUDED.score IS NOT NULL THEN 1 ELSE 0 END,
       updated_at        = NOW()
     RETURNING *`,
    [
      data.userId,
      data.contentItemId,
      data.progressSeconds ?? 0,
      data.lastPositionSec ?? 0,
      data.completed ?? false,
      data.score ?? null,
      data.idempotencyKey ?? randomUUID(),
    ]
  );
  return rows[0];
}
