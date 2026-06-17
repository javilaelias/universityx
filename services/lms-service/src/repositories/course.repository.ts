import { query, withTransaction } from '../db/postgres';
import type { Course, Module, ContentItem } from '../types/lms.types';

// ── Cursos ────────────────────────────────────────────────────────────────────

export async function findCourses(opts: {
  search?:  string;
  level?:   string;
  limit?:   number;
  offset?:  number;
}) {
  const { search, level, limit = 20, offset = 0 } = opts;
  const conditions: string[] = ['c.is_published = true'];
  const params: unknown[] = [];
  let p = 1;

  if (search) {
    conditions.push(`(c.title ILIKE $${p} OR c.description ILIKE $${p})`);
    params.push(`%${search}%`);
    p++;
  }
  if (level) {
    conditions.push(`c.level = $${p}`);
    params.push(level);
    p++;
  }

  const where = conditions.join(' AND ');
  params.push(limit, offset);

  const { rows } = await query<Course & { instructor_name: string; enrolled_count: number }>(
    `SELECT c.*,
            u.full_name AS instructor_name,
            COUNT(DISTINCT e.id)::int AS enrolled_count
     FROM   courses c
     LEFT   JOIN users u ON u.id = c.instructor_id
     LEFT   JOIN enrollments e ON e.course_id = c.id
     WHERE  ${where}
     GROUP  BY c.id, u.full_name
     ORDER  BY c.created_at DESC
     LIMIT  $${p} OFFSET $${p + 1}`,
    params
  );

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM courses c WHERE ${where}`,
    params.slice(0, params.length - 2)
  );

  return { courses: rows, total: parseInt(countResult.rows[0]?.total ?? '0') };
}

export async function findCourseById(id: string) {
  const { rows } = await query<Course & { instructor_name: string; instructor_avatar: string | null }>(
    `SELECT c.*, u.full_name AS instructor_name, u.avatar_url AS instructor_avatar
     FROM   courses c
     LEFT   JOIN users u ON u.id = c.instructor_id
     WHERE  c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findCourseBySlug(slug: string) {
  const { rows } = await query<Course>(
    'SELECT * FROM courses WHERE slug = $1 AND is_published = true',
    [slug]
  );
  return rows[0] ?? null;
}

export async function createCourse(data: {
  title: string; slug: string; description?: string;
  instructor_id: string; level: string; language: string; tags: string[];
}) {
  const { rows } = await query<Course>(
    `INSERT INTO courses (title, slug, description, instructor_id, level, language, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.title, data.slug, data.description ?? null,
     data.instructor_id, data.level, data.language, data.tags]
  );
  return rows[0];
}

export async function updateCourse(id: string, data: Partial<Course>) {
  const fields = Object.keys(data).filter((k) => k !== 'id');
  const sets   = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals   = fields.map((k) => (data as Record<string, unknown>)[k]);

  const { rows } = await query<Course>(
    `UPDATE courses SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...vals]
  );
  return rows[0] ?? null;
}

// ── Módulos ───────────────────────────────────────────────────────────────────

export async function findModulesByCourse(courseId: string, includeLockedDrip = false) {
  const { rows } = await query<Module>(
    `SELECT *,
            (release_date IS NOT NULL AND release_date > NOW()) AS is_locked
     FROM   modules
     WHERE  course_id = $1
     ${!includeLockedDrip ? "AND (release_date IS NULL OR release_date <= NOW())" : ""}
     ORDER  BY position ASC`,
    [courseId]
  );
  return rows;
}

export async function findModuleById(moduleId: string) {
  const { rows } = await query<Module>(
    'SELECT * FROM modules WHERE id = $1',
    [moduleId]
  );
  return rows[0] ?? null;
}

export async function createModule(data: {
  course_id: string; title: string; description?: string;
  position: number; release_date?: Date | null; is_downloadable?: boolean;
}) {
  const { rows } = await query<Module>(
    `INSERT INTO modules (course_id, title, description, position, release_date, is_downloadable)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.course_id, data.title, data.description ?? null,
     data.position, data.release_date ?? null, data.is_downloadable ?? true]
  );
  return rows[0];
}

// ── Contenido ─────────────────────────────────────────────────────────────────

export async function findContentByModule(moduleId: string) {
  const { rows } = await query<ContentItem>(
    `SELECT * FROM content_items WHERE module_id = $1 ORDER BY position ASC`,
    [moduleId]
  );
  return rows;
}

export async function findContentById(id: string) {
  const { rows } = await query<ContentItem>(
    'SELECT * FROM content_items WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function createContentItem(data: {
  module_id: string; type: string; title: string; description?: string;
  content_url?: string; duration_seconds?: number; position: number;
  offline_size_mb?: number; is_free_preview?: boolean;
}) {
  const { rows } = await query<ContentItem>(
    `INSERT INTO content_items
       (module_id, type, title, description, content_url, duration_seconds,
        position, offline_size_mb, is_free_preview)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.module_id, data.type, data.title, data.description ?? null,
     data.content_url ?? null, data.duration_seconds ?? null,
     data.position, data.offline_size_mb ?? null, data.is_free_preview ?? false]
  );
  return rows[0];
}

// ── Panel Instructor ──────────────────────────────────────────────────────────

export async function findCoursesByInstructor(instructorId: string) {
  const { rows } = await query<Course & { module_count: number; content_count: number; enrolled_count: number }>(
    `SELECT c.*,
            COUNT(DISTINCT m.id)::int  AS module_count,
            COUNT(DISTINCT ci.id)::int AS content_count,
            COUNT(DISTINCT e.id)::int  AS enrolled_count
     FROM   courses c
     LEFT   JOIN modules m        ON m.course_id  = c.id
     LEFT   JOIN content_items ci ON ci.module_id = m.id
     LEFT   JOIN enrollments e    ON e.course_id  = c.id
     WHERE  c.instructor_id = $1
     GROUP  BY c.id
     ORDER  BY c.created_at DESC`,
    [instructorId]
  );
  return rows;
}

export async function deleteCourseById(id: string) {
  const { rowCount } = await query('DELETE FROM courses WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function updateModule(id: string, data: Partial<Omit<Module, 'id' | 'course_id' | 'is_locked'>>) {
  const fields = Object.keys(data);
  if (!fields.length) return null;
  const sets = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals  = fields.map((k) => (data as Record<string, unknown>)[k]);
  const { rows } = await query<Module>(
    `UPDATE modules SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...vals]
  );
  return rows[0] ?? null;
}

export async function deleteModuleById(id: string) {
  const { rowCount } = await query('DELETE FROM modules WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function updateContentItemById(id: string, data: Partial<Omit<ContentItem, 'id' | 'module_id'>>) {
  const fields = Object.keys(data);
  if (!fields.length) return null;
  const sets = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals  = fields.map((k) => (data as Record<string, unknown>)[k]);
  const { rows } = await query<ContentItem>(
    `UPDATE content_items SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...vals]
  );
  return rows[0] ?? null;
}

export async function deleteContentItemById(id: string) {
  const { rowCount } = await query('DELETE FROM content_items WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

// ── Resumen de curso (módulos + items + recuento) ─────────────────────────────

export async function getCourseWithModules(courseId: string) {
  const course = await findCourseById(courseId);
  if (!course) return null;

  const modules = await findModulesByCourse(courseId);

  const modulesWithContent = await Promise.all(
    modules.map(async (mod) => ({
      ...mod,
      content_items: await findContentByModule(mod.id),
    }))
  );

  return { ...course, modules: modulesWithContent };
}
