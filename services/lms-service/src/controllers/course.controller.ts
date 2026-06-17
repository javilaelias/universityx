import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as repo from '../repositories/course.repository';
import { cacheGet, cacheSet, cacheInvalidate } from '../db/redis';
import { findEnrollment } from '../repositories/enrollment.repository';

export const createCourseSchema = z.object({
  title:       z.string().min(3).max(500),
  slug:        z.string().min(3).max(500).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  level:       z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  language:    z.string().default('es'),
  tags:        z.array(z.string()).default([]),
});

export const createModuleSchema = z.object({
  title:           z.string().min(2).max(500),
  description:     z.string().optional(),
  position:        z.number().int().positive(),
  release_date:    z.string().datetime().optional().nullable(),
  is_downloadable: z.boolean().default(true),
});

export const createContentSchema = z.object({
  type:             z.enum(['video', 'document', 'quiz', 'assignment', 'live_session']),
  title:            z.string().min(2).max(500),
  description:      z.string().optional(),
  content_url:      z.string().url().optional(),
  duration_seconds: z.number().int().nonnegative().optional(),
  position:         z.number().int().positive(),
  offline_size_mb:  z.number().nonnegative().optional(),
  is_free_preview:  z.boolean().default(false),
});

// ── GET /courses ──────────────────────────────────────────────────────────────
export async function listCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, level, limit = '20', offset = '0' } = req.query as Record<string, string>;
    const cacheKey = `courses:list:${search ?? ''}:${level ?? ''}:${limit}:${offset}`;

    const cached = await cacheGet(cacheKey);
    if (cached) { res.json(cached); return; }

    const result = await repo.findCourses({
      search, level,
      limit:  parseInt(limit),
      offset: parseInt(offset),
    });

    await cacheSet(cacheKey, result);
    res.json(result);
  } catch (err) { next(err); }
}

// ── GET /courses/:id ──────────────────────────────────────────────────────────
export async function getCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const cacheKey = `course:${id}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      const enrolled = req.user
        ? await findEnrollment(req.user.sub, id) !== null
        : false;
      res.json({ ...(cached as object), enrolled });
      return;
    }

    const course = await repo.getCourseWithModules(id);
    if (!course) { res.status(404).json({ error: 'Curso no encontrado' }); return; }

    await cacheSet(cacheKey, course);

    const enrolled = req.user
      ? await findEnrollment(req.user.sub, id) !== null
      : false;

    res.json({ ...course, enrolled });
  } catch (err) { next(err); }
}

// ── POST /courses ─────────────────────────────────────────────────────────────
export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as z.infer<typeof createCourseSchema>;
    const course = await repo.createCourse({ ...data, instructor_id: req.user!.sub });
    await cacheInvalidate('courses:list:*');
    res.status(201).json({ course });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'El slug ya existe' });
      return;
    }
    next(err);
  }
}

// ── PATCH /courses/:id ────────────────────────────────────────────────────────
export async function patchCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await repo.updateCourse(req.params.id, req.body);
    if (!course) { res.status(404).json({ error: 'Curso no encontrado' }); return; }
    await cacheInvalidate(`course:${req.params.id}`);
    await cacheInvalidate('courses:list:*');
    res.json({ course });
  } catch (err) { next(err); }
}

// ── POST /courses/:courseId/modules ───────────────────────────────────────────
export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.params;
    const data = req.body as z.infer<typeof createModuleSchema>;
    const module = await repo.createModule({
      ...data,
      course_id:    courseId,
      release_date: data.release_date ? new Date(data.release_date) : null,
    });
    await cacheInvalidate(`course:${courseId}`);
    res.status(201).json({ module });
  } catch (err) { next(err); }
}

// ── POST /modules/:moduleId/content ──────────────────────────────────────────
export async function createContent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as z.infer<typeof createContentSchema>;
    const item = await repo.createContentItem({ ...data, module_id: req.params.moduleId });
    res.status(201).json({ content_item: item });
  } catch (err) { next(err); }
}
