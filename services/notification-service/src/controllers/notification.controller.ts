import { Request, Response } from 'express';
import { z }                  from 'zod';
import { pool }               from '../db/postgres';
import { notificationQueue }  from '../queues';
import type { AuthRequest }   from '../middleware/auth';

const triggerSchema = z.object({
  event:  z.string().min(1),
  userId: z.string().uuid(),
  email:  z.string().email(),
  data:   z.record(z.unknown()).default({}),
});

// POST /notifications/trigger — called internally by other services (no auth)
export async function trigger(req: Request, res: Response) {
  const parsed = triggerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    return;
  }
  // Job name is fixed; event type lives in the job data
  await notificationQueue.add('send', parsed.data);
  res.status(202).json({ queued: true });
}

// GET /notifications
export async function list(req: AuthRequest, res: Response) {
  const limit  = Math.min(Number(req.query.limit)  || 20, 50);
  const offset = Math.max(Number(req.query.offset) || 0,   0);
  const unread = req.query.unread === 'true';
  const where  = unread ? 'AND is_read = false' : '';

  const { rows } = await pool.query(
    `SELECT id, type, title, body, data, is_read, created_at
     FROM   notifications
     WHERE  user_id = $1 ${where}
     ORDER  BY created_at DESC
     LIMIT  $2 OFFSET $3`,
    [req.userId, limit, offset],
  );
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 ${unread ? 'AND is_read = false' : ''}`,
    [req.userId],
  );
  res.json({ notifications: rows, total: Number(count), limit, offset });
}

// GET /notifications/count
export async function unreadCount(req: AuthRequest, res: Response) {
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [req.userId],
  );
  res.json({ count: Number(count) });
}

// PUT /notifications/:id/read
export async function markRead(req: AuthRequest, res: Response) {
  await pool.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId],
  );
  res.json({ ok: true });
}

// PUT /notifications/read-all
export async function markAllRead(req: AuthRequest, res: Response) {
  const { rowCount } = await pool.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [req.userId],
  );
  res.json({ updated: rowCount });
}
