import { Request, Response } from 'express';
import { z }                  from 'zod';
import { pool }               from '../db/postgres';
import { notificationQueue }  from '../queues';
import { jobOptionsFor, isAllowedResetUrl } from '../queues/events';
import { env }                from '../config/env';
import type { AuthRequest }   from '../middleware/auth';
import { registerDeviceSchema, unregisterDeviceSchema } from '../push/devices';

const triggerSchema = z.object({
  event:  z.string().min(1),
  userId: z.string().uuid(),
  email:  z.string().email(),
  data:   z.record(z.unknown()).default({}),
  locale: z.enum(['es', 'en']).default('es').catch('es'),
});

// POST /notifications/trigger — called internally by other services (no auth)
export async function trigger(req: Request, res: Response) {
  const parsed = triggerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    return;
  }
  if (parsed.data.event === 'auth.password_reset'
      && !isAllowedResetUrl(parsed.data.data.resetUrl, env.WEB_BASE_URL)) {
    res.status(400).json({ message: 'resetUrl no permitido' });
    return;
  }
  // Job name is fixed; event type lives in the job data
  await notificationQueue.add('send', parsed.data, jobOptionsFor(parsed.data.event));
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

// POST /notifications/devices — registra el token FCM del dispositivo del usuario.
// Un token es de un solo usuario: si otra cuenta inicia sesión en ese equipo, se reasigna.
export async function registerDevice(req: AuthRequest, res: Response) {
  const parsed = registerDeviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    return;
  }
  await pool.query(
    `INSERT INTO device_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE
       SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW()`,
    [req.userId, parsed.data.token, parsed.data.platform],
  );
  res.status(204).end();
}

// DELETE /notifications/devices — al cerrar sesión; solo borra tokens propios.
export async function unregisterDevice(req: AuthRequest, res: Response) {
  const parsed = unregisterDeviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Payload inválido', errors: parsed.error.flatten() });
    return;
  }
  await pool.query(
    `DELETE FROM device_tokens WHERE token = $1 AND user_id = $2`,
    [parsed.data.token, req.userId],
  );
  res.status(204).end();
}
