import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as progressRepo  from '../repositories/progress.repository';
import * as enrollRepo    from '../repositories/enrollment.repository';
import { findContentById } from '../repositories/course.repository';

export const upsertProgressSchema = z.object({
  contentItemId:   z.string().uuid(),
  progressSeconds: z.number().nonnegative().optional(),
  lastPositionSec: z.number().nonnegative().optional(),
  completed:       z.boolean().optional(),
  idempotencyKey:  z.string().uuid().optional(),
});

// ── GET /courses/:courseId/progress ───────────────────────────────────────────
export async function getCourseProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.params;
    const userId = req.user!.sub;

    const enrollment = await enrollRepo.findEnrollment(userId, courseId);
    if (!enrollment) {
      res.status(403).json({ error: 'No estás matriculado en este curso' });
      return;
    }

    const items = await progressRepo.findCourseProgress(userId, courseId);
    res.json({ progress_pct: enrollment.progress_pct, items });
  } catch (err) { next(err); }
}

// ── POST /progress ────────────────────────────────────────────────────────────
export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data   = req.body as z.infer<typeof upsertProgressSchema>;
    const userId = req.user!.sub;

    // Verificar que el contenido existe y el estudiante está matriculado
    const contentItem = await findContentById(data.contentItemId);
    if (!contentItem) {
      res.status(404).json({ error: 'Contenido no encontrado' });
      return;
    }
    // Un quiz solo se completa aprobándolo (POST /quizzes/:id/submit): si no, el certificado
    // se podría reclamar sin rendirlo.
    if (contentItem.type === 'quiz' && data.completed) {
      res.status(422).json({ error: 'El quiz se completa al aprobarlo' });
      return;
    }

    const progress = await progressRepo.upsertProgress({
      userId,
      contentItemId:   data.contentItemId,
      progressSeconds: data.progressSeconds,
      lastPositionSec: data.lastPositionSec,
      completed:       data.completed,
      idempotencyKey:  data.idempotencyKey,
    });

    // Recalcular progreso del curso antes de responder (el certificado se reclama con ese %)
    const { rows } = await import('../db/postgres').then((m) =>
      m.query<{ course_id: string }>(
        'SELECT course_id FROM modules WHERE id = (SELECT module_id FROM content_items WHERE id = $1)',
        [data.contentItemId]
      )
    );
    const courseId = rows[0]?.course_id;
    if (courseId) {
      await enrollRepo.updateProgressPct(userId, courseId).catch(console.error);
    }

    res.json({ progress });
  } catch (err) { next(err); }
}
