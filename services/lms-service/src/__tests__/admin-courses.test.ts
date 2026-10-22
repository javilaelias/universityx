import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/postgres', () => ({
  pool:            { query: vi.fn() },
  query:           vi.fn(),
  connectPostgres: vi.fn().mockResolvedValue(undefined),
  withTransaction: vi.fn(),
}));

vi.mock('../db/redis', () => ({
  connectRedis:    vi.fn().mockResolvedValue(undefined),
  cacheGet:        vi.fn().mockResolvedValue(null),
  cacheSet:        vi.fn().mockResolvedValue(undefined),
  cacheInvalidate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../repositories/course.repository', () => ({
  findCourseById:      vi.fn(),
  updateCourse:        vi.fn(),
  findAllCoursesAdmin: vi.fn(),
}));

import { app } from '../app';
import * as courseRepo from '../repositories/course.repository';

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-here-ok';
const OWNER_ID   = '00000000-0000-0000-0000-000000000002';
const OTHER_ID   = '00000000-0000-0000-0000-000000000009';
const COURSE_ID  = '00000000-0000-0000-0000-000000000001';

function auth(role: string, sub = OWNER_ID) {
  return `Bearer ${jwt.sign({ sub, role, email: 'x@example.com' }, JWT_SECRET, { expiresIn: '1h' })}`;
}

const repo = vi.mocked(courseRepo);
const course = { id: COURSE_ID, title: 'Curso', instructor_id: OWNER_ID, is_published: false };

beforeEach(() => vi.clearAllMocks());

describe('GET /api/admin/courses', () => {
  it('403 para instructor', async () => {
    const res = await request(app).get('/api/admin/courses').set('Authorization', auth('instructor'));
    expect(res.status).toBe(403);
    expect(repo.findAllCoursesAdmin).not.toHaveBeenCalled();
  });

  it('200 para admin con todos los cursos', async () => {
    repo.findAllCoursesAdmin.mockResolvedValueOnce([course] as any);
    const res = await request(app).get('/api/admin/courses').set('Authorization', auth('admin'));
    expect(res.status).toBe(200);
    expect(res.body.courses).toHaveLength(1);
  });

  it('401 con token firmado con otro algoritmo', async () => {
    const token = jwt.sign({ sub: OWNER_ID, role: 'admin' }, JWT_SECRET, { algorithm: 'HS512' });
    const res = await request(app).get('/api/admin/courses').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/courses/:id', () => {
  it('403 si el instructor no es el dueño', async () => {
    repo.findCourseById.mockResolvedValueOnce(course as any);
    const res = await request(app)
      .patch(`/api/courses/${COURSE_ID}`)
      .set('Authorization', auth('instructor', OTHER_ID))
      .send({ title: 'Robado' });
    expect(res.status).toBe(403);
    expect(repo.updateCourse).not.toHaveBeenCalled();
  });

  it('descarta claves fuera de la lista blanca (incluido is_published)', async () => {
    repo.findCourseById.mockResolvedValueOnce(course as any);
    repo.updateCourse.mockResolvedValueOnce({ ...course, title: 'Nuevo' } as any);
    const res = await request(app)
      .patch(`/api/courses/${COURSE_ID}`)
      .set('Authorization', auth('instructor'))
      .send({ title: 'Nuevo', is_published: true, 'id = id; DROP TABLE x; --': 1 });
    expect(res.status).toBe(200);
    expect(repo.updateCourse).toHaveBeenCalledWith(COURSE_ID, { title: 'Nuevo' });
  });

  it('acepta lo que manda el editor del instructor', async () => {
    repo.findCourseById.mockResolvedValueOnce(course as any);
    repo.updateCourse.mockResolvedValueOnce(course as any);
    const body = {
      title: 'Curso', slug: 'curso-1', description: null, thumbnail_url: null,
      level: 'beginner', language: 'es', tags: ['a'],
    };
    const res = await request(app).patch(`/api/courses/${COURSE_ID}`).set('Authorization', auth('instructor')).send(body);
    expect(res.status).toBe(200);
    expect(repo.updateCourse).toHaveBeenCalledWith(COURSE_ID, body);
  });

  it('409 si el slug ya existe', async () => {
    repo.findCourseById.mockResolvedValueOnce(course as any);
    repo.updateCourse.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }));
    const res = await request(app).patch(`/api/courses/${COURSE_ID}`).set('Authorization', auth('instructor')).send({ slug: 'otro' });
    expect(res.status).toBe(409);
  });

  it('admin puede editar un curso ajeno', async () => {
    repo.findCourseById.mockResolvedValueOnce(course as any);
    repo.updateCourse.mockResolvedValueOnce(course as any);
    const res = await request(app)
      .patch(`/api/courses/${COURSE_ID}`)
      .set('Authorization', auth('admin', OTHER_ID))
      .send({ level: 'advanced' });
    expect(res.status).toBe(200);
  });

  it('400 con body vacío o id inválido', async () => {
    const a = await request(app).patch(`/api/courses/${COURSE_ID}`).set('Authorization', auth('instructor')).send({});
    const b = await request(app).patch('/api/courses/1').set('Authorization', auth('instructor')).send({ title: 'Nuevo' });
    expect(a.status).toBe(400);
    expect(b.status).toBe(400);
  });
});
