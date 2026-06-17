import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as enrollRepo from '../repositories/enrollment.repository';
import * as courseRepo  from '../repositories/course.repository';

export const enrollSchema = z.object({
  courseId: z.string().uuid(),
});

// ── GET /enrollments  (mis cursos matriculados) ───────────────────────────────
export async function listEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollments = await enrollRepo.findUserEnrollments(req.user!.sub);
    res.json({ enrollments });
  } catch (err) { next(err); }
}

// ── POST /enrollments ─────────────────────────────────────────────────────────
export async function enrollInCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.body as z.infer<typeof enrollSchema>;

    const course = await courseRepo.findCourseById(courseId);
    if (!course || !course.is_published) {
      res.status(404).json({ error: 'Curso no encontrado o no publicado' });
      return;
    }

    const enrollment = await enrollRepo.enroll(req.user!.sub, courseId);
    res.status(201).json({ enrollment });
  } catch (err) { next(err); }
}

// ── DELETE /enrollments/:courseId ─────────────────────────────────────────────
export async function unenrollFromCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await enrollRepo.unenroll(req.user!.sub, req.params.courseId);
    if (!deleted) { res.status(404).json({ error: 'Matrícula no encontrada' }); return; }
    res.json({ message: 'Matrícula cancelada' });
  } catch (err) { next(err); }
}
