import { Response }      from 'express';
import { z }             from 'zod';
import { pool }          from '../db/postgres';
import { buildOpenBadge } from '../lib/openbadges';
import type { AuthRequest } from '../middleware/auth';

const issueSchema = z.object({
  userId:   z.string().uuid(),
  courseId: z.string().uuid(),
});

export const credentialCtrl = {

  // POST /credentials/issue — called by lms-service on course completion
  async issue(req: AuthRequest, res: Response) {
    const parsed = issueSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() }); return; }

    const { userId, courseId } = parsed.data;

    // Check enrollment progress
    const { rows: [enrollment] } = await pool.query(
      `SELECT e.progress_pct, u.email, u.full_name, c.title, c.description
       FROM   enrollments e
       JOIN   users   u ON u.id = e.user_id
       JOIN   courses c ON c.id = e.course_id
       WHERE  e.user_id = $1 AND e.course_id = $2`,
      [userId, courseId],
    );

    if (!enrollment) { res.status(404).json({ message: 'Matrícula no encontrada' }); return; }
    if (Number(enrollment.progress_pct) < 100) {
      res.status(422).json({ message: `Curso incompleto (${enrollment.progress_pct}%). Se requiere 100%.` });
      return;
    }

    // Check if already issued
    const { rows: [existing] } = await pool.query(
      `SELECT ub.id FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1 AND b.course_id = $2`,
      [userId, courseId],
    );
    if (existing) { res.status(409).json({ message: 'Credencial ya emitida' }); return; }

    // Ensure a badge row exists for this course
    const { rows: [badge] } = await pool.query(
      `INSERT INTO badges (name, description, course_id, source, criteria)
       VALUES ($1, $2, $3, 'internal', $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        enrollment.title,
        `Insignia por completar el curso "${enrollment.title}"`,
        courseId,
        JSON.stringify({ narrative: 'Completar todos los módulos con ≥60% en quizzes.' }),
      ],
    );

    const badgeId = badge?.id ?? (await pool.query(
      `SELECT id FROM badges WHERE course_id = $1`, [courseId]
    )).rows[0].id;

    // Build the Open Badge 3.0 credential
    const credential = buildOpenBadge({
      userId,
      userEmail:  enrollment.email,
      courseId,
      courseName: enrollment.title,
      courseDesc: enrollment.description,
    });

    // Persist in user_badges
    const { rows: [userBadge] } = await pool.query(
      `INSERT INTO user_badges (user_id, badge_id, is_public)
       VALUES ($1, $2, true)
       RETURNING id, issued_at`,
      [userId, badgeId],
    );

    // Mark enrollment as certificate issued
    await pool.query(
      `UPDATE enrollments SET certificate_issued = true WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId],
    );

    res.status(201).json({ userBadgeId: userBadge.id, issuedAt: userBadge.issued_at, credential });
  },

  // GET /credentials — list user's credentials
  async list(req: AuthRequest, res: Response) {
    const { rows } = await pool.query(
      `SELECT ub.id, ub.issued_at, ub.is_public,
              b.name, b.description, b.image_url, b.course_id,
              c.title AS course_title
       FROM   user_badges ub
       JOIN   badges  b ON b.id  = ub.badge_id
       LEFT   JOIN courses c ON c.id = b.course_id
       WHERE  ub.user_id = $1
       ORDER  BY ub.issued_at DESC`,
      [req.userId],
    );

    const issuer = process.env.ISSUER_URL ?? 'https://universidadx.com';
    const credentials = rows.map(r => ({
      id:              r.id,
      credentialName:  r.name,
      courseName:      r.course_title ?? r.name,
      issuedAt:        r.issued_at,
      isPublic:        r.is_public,
      openBadgeUrl:    `${issuer}/credentials/${r.id}`,
      verifyUrl:       `${issuer}/api/credentials/${r.id}`,
      badge: {
        name:        r.name,
        description: r.description,
        image:       r.image_url ?? '',
      },
    }));

    res.json({ credentials, total: credentials.length });
  },

  // GET /credentials/:id — public badge verification
  async getById(req: AuthRequest, res: Response) {
    const { rows: [row] } = await pool.query(
      `SELECT ub.id, ub.issued_at, ub.user_id,
              b.name, b.description, b.course_id,
              u.email, c.title AS course_title
       FROM   user_badges ub
       JOIN   badges  b ON b.id  = ub.badge_id
       JOIN   users   u ON u.id  = ub.user_id
       LEFT   JOIN courses c ON c.id = b.course_id
       WHERE  ub.id = $1 AND ub.is_public = true`,
      [req.params.id],
    );

    if (!row) { res.status(404).json({ message: 'Credencial no encontrada' }); return; }

    const credential = buildOpenBadge({
      userId:     row.user_id,
      userEmail:  row.email,
      courseId:   row.course_id,
      courseName: row.course_title ?? row.name,
      courseDesc: row.description,
      issuedAt:   new Date(row.issued_at),
    });

    res.json({ id: row.id, issuedAt: row.issued_at, credential });
  },
};
