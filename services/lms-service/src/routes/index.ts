import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import * as courseCtrl     from '../controllers/course.controller';
import * as enrollCtrl     from '../controllers/enrollment.controller';
import * as progressCtrl   from '../controllers/progress.controller';
import * as quizCtrl       from '../controllers/quiz.controller';
import * as dashboardCtrl  from '../controllers/dashboard.controller';

export const router = Router();

const apiLimit = rateLimit({
  windowMs: 60_000, max: 120,
  skip: (req) => req.app.get('env') === 'test',
});

router.use(apiLimit);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, dashboardCtrl.getDashboard);

// ── Cursos (público: listado y detalle; privado: create/update) ───────────────
router.get('/courses',     courseCtrl.listCourses);
router.get('/courses/:id', courseCtrl.getCourse);           // JWT opcional

router.post('/courses',
  requireAuth,
  requireRole('instructor', 'admin'),
  validate(courseCtrl.createCourseSchema),
  courseCtrl.createCourse
);

router.patch('/courses/:id',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.patchCourse
);

// ── Módulos y contenido ────────────────────────────────────────────────────────
router.post('/courses/:courseId/modules',
  requireAuth,
  requireRole('instructor', 'admin'),
  validate(courseCtrl.createModuleSchema),
  courseCtrl.createModule
);

router.post('/modules/:moduleId/content',
  requireAuth,
  requireRole('instructor', 'admin'),
  validate(courseCtrl.createContentSchema),
  courseCtrl.createContent
);

// ── Panel Instructor ──────────────────────────────────────────────────────────
router.get('/instructor/courses',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.myCourses
);

router.delete('/courses/:id',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.deleteCourse
);

router.post('/courses/:id/publish',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.togglePublish
);

router.patch('/modules/:moduleId',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.patchModule
);

router.delete('/modules/:moduleId',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.deleteModule
);

router.patch('/modules/:moduleId/content/:contentId',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.patchContent
);

router.delete('/modules/:moduleId/content/:contentId',
  requireAuth,
  requireRole('instructor', 'admin'),
  courseCtrl.deleteContent
);

// ── Matrículas ────────────────────────────────────────────────────────────────
router.get('/enrollments',
  requireAuth,
  enrollCtrl.listEnrollments
);

router.post('/enrollments',
  requireAuth,
  validate(enrollCtrl.enrollSchema),
  enrollCtrl.enrollInCourse
);

router.delete('/enrollments/:courseId',
  requireAuth,
  enrollCtrl.unenrollFromCourse
);

// ── Progreso ──────────────────────────────────────────────────────────────────
router.get('/courses/:courseId/progress',
  requireAuth,
  progressCtrl.getCourseProgress
);

router.post('/progress',
  requireAuth,
  validate(progressCtrl.upsertProgressSchema),
  progressCtrl.updateProgress
);

// ── Quizzes ───────────────────────────────────────────────────────────────────
router.get('/quizzes/:contentItemId',
  requireAuth,
  quizCtrl.getQuiz
);

router.post('/quizzes/:contentItemId/submit',
  requireAuth,
  validate(quizCtrl.submitQuizSchema),
  quizCtrl.submitQuiz
);

router.get('/quizzes/:contentItemId/attempts',
  requireAuth,
  quizCtrl.getAttempts
);
