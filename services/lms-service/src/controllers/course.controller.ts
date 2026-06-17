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

// ── GET /instructor/courses ────────────────────────────────────────────────────
export async function myCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const courses = await repo.findCoursesByInstructor(req.user!.sub);
    res.json({ courses });
  } catch (err) { next(err); }
}

// ── DELETE /courses/:id ────────────────────────────────────────────────────────
export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await repo.findCourseById(req.params.id);
    if (!course) { res.status(404).json({ error: 'Curso no encontrado' }); return; }
    if (course.instructor_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permisos' }); return;
    }
    await repo.deleteCourseById(req.params.id);
    await cacheInvalidate(`course:${req.params.id}`);
    await cacheInvalidate('courses:list:*');
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── POST /courses/:id/publish ─────────────────────────────────────────────────
export async function togglePublish(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await repo.findCourseById(req.params.id);
    if (!course) { res.status(404).json({ error: 'Curso no encontrado' }); return; }
    if (course.instructor_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permisos' }); return;
    }
    const updated = await repo.updateCourse(req.params.id, { is_published: !course.is_published });
    await cacheInvalidate(`course:${req.params.id}`);
    await cacheInvalidate('courses:list:*');
    res.json({ course: updated });
  } catch (err) { next(err); }
}

// ── PATCH /modules/:moduleId ──────────────────────────────────────────────────
export async function patchModule(req: Request, res: Response, next: NextFunction) {
  try {
    const mod = await repo.findModuleById(req.params.moduleId);
    if (!mod) { res.status(404).json({ error: 'Módulo no encontrado' }); return; }
    const course = await repo.findCourseById(mod.course_id);
    if (course?.instructor_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permisos' }); return;
    }
    const data = { ...req.body };
    if ('release_date' in data && data.release_date) {
      data.release_date = new Date(data.release_date);
    }
    const updated = await repo.updateModule(req.params.moduleId, data);
    await cacheInvalidate(`course:${mod.course_id}`);
    res.json({ module: updated });
  } catch (err) { next(err); }
}

// ── DELETE /modules/:moduleId ─────────────────────────────────────────────────
export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    const mod = await repo.findModuleById(req.params.moduleId);
    if (!mod) { res.status(404).json({ error: 'Módulo no encontrado' }); return; }
    const course = await repo.findCourseById(mod.course_id);
    if (course?.instructor_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permisos' }); return;
    }
    await repo.deleteModuleById(req.params.moduleId);
    await cacheInvalidate(`course:${mod.course_id}`);
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── PATCH /modules/:moduleId/content/:contentId ───────────────────────────────
export async function patchContent(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await repo.findContentById(req.params.contentId);
    if (!item) { res.status(404).json({ error: 'Contenido no encontrado' }); return; }
    const mod = await repo.findModuleById(item.module_id);
    const course = mod ? await repo.findCourseById(mod.course_id) : null;
    if (course?.instructor_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permisos' }); return;
    }
    const updated = await repo.updateContentItemById(req.params.contentId, req.body);
    res.json({ content_item: updated });
  } catch (err) { next(err); }
}

// ── DELETE /modules/:moduleId/content/:contentId ──────────────────────────────
export async function deleteContent(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await repo.findContentById(req.params.contentId);
    if (!item) { res.status(404).json({ error: 'Contenido no encontrado' }); return; }
    const mod = await repo.findModuleById(item.module_id);
    const course = mod ? await repo.findCourseById(mod.course_id) : null;
    if (course?.instructor_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permisos' }); return;
    }
    await repo.deleteContentItemById(req.params.contentId);
    res.status(204).send();
  } catch (err) { next(err); }
}
