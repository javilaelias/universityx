import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as quizRepo     from '../repositories/quiz.repository';
import * as progressRepo from '../repositories/progress.repository';
import * as enrollRepo   from '../repositories/enrollment.repository';
import { findContentById } from '../repositories/course.repository';

export const submitQuizSchema = z.object({
  answers: z.record(z.string().uuid(), z.string().uuid()),
});

// ── GET /quizzes/:contentItemId ───────────────────────────────────────────────
export async function getQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { contentItemId } = req.params;

    const quiz = await quizRepo.findQuizByContentItem(contentItemId);
    if (!quiz) { res.status(404).json({ error: 'Quiz no encontrado' }); return; }

    const questions = await quizRepo.findQuizQuestionsForStudent(quiz.id);
    const attempts  = req.user
      ? await quizRepo.findUserAttempts(req.user.sub, contentItemId)
      : [];

    const bestScore  = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score ?? 0)) : null;
    const attemptsLeft = quiz.max_attempts - attempts.length;

    res.json({
      quiz: {
        id:               quiz.id,
        content_item_id:  quiz.content_item_id,
        passing_score:    quiz.passing_score,
        max_attempts:     quiz.max_attempts,
        time_limit_sec:   quiz.time_limit_sec,
        questions,
      },
      my_attempts: attempts,
      best_score:  bestScore,
      attempts_left: Math.max(0, attemptsLeft),
    });
  } catch (err) { next(err); }
}

// ── POST /quizzes/:contentItemId/submit ───────────────────────────────────────
export async function submitQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { contentItemId } = req.params;
    const { answers }       = req.body as z.infer<typeof submitQuizSchema>;
    const userId            = req.user!.sub;

    const quiz = await quizRepo.findQuizByContentItem(contentItemId);
    if (!quiz) { res.status(404).json({ error: 'Quiz no encontrado' }); return; }

    const attemptCount = await quizRepo.countAttempts(userId, contentItemId);
    if (attemptCount >= quiz.max_attempts) {
      res.status(409).json({ error: `Máximo de ${quiz.max_attempts} intentos alcanzado` });
      return;
    }

    const attempt = await quizRepo.gradeAndSaveAttempt(
      userId, contentItemId, quiz.id, answers, quiz.passing_score
    );

    // Si aprobó → marcar como completado en progress
    if (attempt.passed) {
      const content = await findContentById(contentItemId);
      if (content) {
        await progressRepo.upsertProgress({
          userId, contentItemId, completed: true, score: attempt.score ?? undefined,
        });

        // Recalcular % del curso
        const { rows } = await import('../db/postgres').then((m) =>
          m.query<{ course_id: string }>(
            'SELECT course_id FROM modules WHERE id = (SELECT module_id FROM content_items WHERE id = $1)',
            [contentItemId]
          )
        );
        const courseId = rows[0]?.course_id;
        if (courseId) enrollRepo.updateProgressPct(userId, courseId).catch(console.error);
      }
    }

    res.status(201).json({
      attempt: {
        id:           attempt.id,
        score:        attempt.score,
        passed:       attempt.passed,
        submitted_at: attempt.submitted_at,
      },
      message: attempt.passed
        ? `¡Felicidades! Obtuviste ${attempt.score}% — aprobado`
        : `Obtuviste ${attempt.score}%. Necesitas ${quiz.passing_score}% para aprobar`,
    });
  } catch (err) { next(err); }
}

// ── GET /quizzes/:contentItemId/attempts ─────────────────────────────────────
export async function getAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const attempts = await quizRepo.findUserAttempts(req.user!.sub, req.params.contentItemId);
    res.json({ attempts });
  } catch (err) { next(err); }
}
