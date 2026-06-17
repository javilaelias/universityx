import { Response } from 'express';
import { z }        from 'zod';
import { pool }     from '../db/postgres';
import type { AuthRequest } from '../middleware/auth';

// ── Event schemas ─────────────────────────────────────────────────────────────

const progressUpdateSchema = z.object({
  type:             z.literal('progress_update'),
  idempotencyKey:   z.string().uuid(),
  contentItemId:    z.string().uuid(),
  isCompleted:      z.boolean().default(false),
  progressSeconds:  z.number().int().min(0).default(0),
  occurredAt:       z.string().datetime(),
});

const quizSubmitSchema = z.object({
  type:             z.literal('quiz_submit'),
  idempotencyKey:   z.string().uuid(),
  contentItemId:    z.string().uuid(),
  score:            z.number().min(0).max(100),
  occurredAt:       z.string().datetime(),
});

const contentCompleteSchema = z.object({
  type:           z.literal('content_complete'),
  idempotencyKey: z.string().uuid(),
  contentItemId:  z.string().uuid(),
  occurredAt:     z.string().datetime(),
});

const syncEventSchema = z.discriminatedUnion('type', [
  progressUpdateSchema,
  quizSubmitSchema,
  contentCompleteSchema,
]);

const batchSchema = z.object({
  deviceId: z.string().min(1),
  events:   z.array(syncEventSchema).min(1).max(200),
});

type SyncEvent  = z.infer<typeof syncEventSchema>;
type EventResult = { idempotencyKey: string; status: 'applied' | 'skipped' | 'error'; error?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function processProgressUpdate(
  userId: string,
  event:  z.infer<typeof progressUpdateSchema>,
): Promise<'applied' | 'skipped'> {
  const result = await pool.query(
    `INSERT INTO progress
       (user_id, content_item_id, completed, progress_seconds,
        completed_at, idempotency_key, is_offline_pending, synced_at)
     VALUES ($1, $2, $3, $4,
             CASE WHEN $3 THEN $5::timestamptz ELSE NULL END,
             $6, false, NOW())
     ON CONFLICT (user_id, content_item_id) DO UPDATE
       SET progress_seconds  = GREATEST(progress.progress_seconds, EXCLUDED.progress_seconds),
           completed         = GREATEST(progress.completed::int, EXCLUDED.completed::int)::boolean,
           completed_at      = COALESCE(progress.completed_at, EXCLUDED.completed_at),
           idempotency_key   = EXCLUDED.idempotency_key,
           is_offline_pending = false,
           synced_at         = NOW(),
           updated_at        = NOW()
     WHERE progress.idempotency_key IS DISTINCT FROM EXCLUDED.idempotency_key`,
    [userId, event.contentItemId, event.isCompleted, event.progressSeconds,
     event.occurredAt, event.idempotencyKey],
  );
  return (result.rowCount ?? 0) > 0 ? 'applied' : 'skipped';
}

async function processQuizSubmit(
  userId: string,
  event:  z.infer<typeof quizSubmitSchema>,
): Promise<'applied' | 'skipped'> {
  // Idempotency: skip if this exact key was already processed
  const existing = await pool.query(
    `SELECT id FROM progress WHERE user_id = $1 AND content_item_id = $2 AND idempotency_key = $3`,
    [userId, event.contentItemId, event.idempotencyKey],
  );
  if ((existing.rowCount ?? 0) > 0) return 'skipped';

  await pool.query(
    `INSERT INTO progress
       (user_id, content_item_id, completed, score, attempts,
        completed_at, idempotency_key, is_offline_pending, synced_at)
     VALUES ($1, $2, $3, $4, 1,
             CASE WHEN $3 THEN $5::timestamptz ELSE NULL END,
             $6, false, NOW())
     ON CONFLICT (user_id, content_item_id) DO UPDATE
       SET score             = GREATEST(progress.score, EXCLUDED.score),
           completed         = GREATEST(progress.completed::int, EXCLUDED.completed::int)::boolean,
           attempts          = progress.attempts + 1,
           completed_at      = COALESCE(progress.completed_at, EXCLUDED.completed_at),
           idempotency_key   = EXCLUDED.idempotency_key,
           is_offline_pending = false,
           synced_at         = NOW(),
           updated_at        = NOW()`,
    [userId, event.contentItemId, event.score >= 60, event.score,
     event.occurredAt, event.idempotencyKey],
  );
  return 'applied';
}

async function processContentComplete(
  userId: string,
  event:  z.infer<typeof contentCompleteSchema>,
): Promise<'applied' | 'skipped'> {
  const result = await pool.query(
    `INSERT INTO progress
       (user_id, content_item_id, completed, completed_at,
        idempotency_key, is_offline_pending, synced_at)
     VALUES ($1, $2, true, $3::timestamptz, $4, false, NOW())
     ON CONFLICT (user_id, content_item_id) DO UPDATE
       SET completed         = true,
           completed_at      = COALESCE(progress.completed_at, EXCLUDED.completed_at),
           idempotency_key   = EXCLUDED.idempotency_key,
           is_offline_pending = false,
           synced_at         = NOW(),
           updated_at        = NOW()
     WHERE progress.completed = false`,
    [userId, event.contentItemId, event.occurredAt, event.idempotencyKey],
  );
  return (result.rowCount ?? 0) > 0 ? 'applied' : 'skipped';
}

async function recalcEnrollmentProgress(userId: string, contentItemId: string) {
  // Find the enrollment for this content item and recalculate progress %
  await pool.query(
    `UPDATE enrollments e
     SET    progress_pct    = sub.pct,
            last_accessed_at = NOW()
     FROM (
       SELECT
         en.id AS enrollment_id,
         ROUND(
           COUNT(p.id) FILTER (WHERE p.completed = true) * 100.0
           / NULLIF(COUNT(ci.id), 0),
           2
         ) AS pct
       FROM   enrollments en
       JOIN   courses      co ON co.id = en.course_id
       JOIN   modules       m  ON m.course_id = co.id
       JOIN   content_items ci ON ci.module_id = m.id
       LEFT   JOIN progress p  ON p.content_item_id = ci.id AND p.user_id = en.user_id
       WHERE  en.user_id = $1
         AND  ci.id = $2
       GROUP  BY en.id
     ) sub
     WHERE e.id = sub.enrollment_id`,
    [userId, contentItemId],
  );
}

// ── Controller ────────────────────────────────────────────────────────────────

export async function batch(req: AuthRequest, res: Response) {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    return;
  }

  const { events } = parsed.data;
  const results: EventResult[] = [];

  for (const event of events as SyncEvent[]) {
    try {
      let status: 'applied' | 'skipped';

      switch (event.type) {
        case 'progress_update':
          status = await processProgressUpdate(req.userId!, event);
          break;
        case 'quiz_submit':
          status = await processQuizSubmit(req.userId!, event);
          break;
        case 'content_complete':
          status = await processContentComplete(req.userId!, event);
          break;
      }

      if (status === 'applied') {
        recalcEnrollmentProgress(req.userId!, event.contentItemId)
          .catch(err => console.error('[sync] recalc failed:', err.message));
      }

      results.push({ idempotencyKey: event.idempotencyKey, status });
    } catch (err) {
      results.push({
        idempotencyKey: event.idempotencyKey,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const applied  = results.filter(r => r.status === 'applied').length;
  const skipped  = results.filter(r => r.status === 'skipped').length;
  const errors   = results.filter(r => r.status === 'error').length;

  res.json({ applied, skipped, errors, results });
}

// GET /sync/status — check if there are offline-pending records to sync
export async function status(req: AuthRequest, res: Response) {
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM progress WHERE user_id = $1 AND is_offline_pending = true`,
    [req.userId],
  );
  res.json({ pendingCount: Number(count) });
}
