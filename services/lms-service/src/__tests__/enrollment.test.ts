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

vi.mock('../repositories/enrollment.repository', () => ({
  findEnrollment:       vi.fn(),
  findUserEnrollments:  vi.fn(),
  enroll:               vi.fn(),
  unenroll:             vi.fn(),
  updateProgressPct:    vi.fn(),
}));

vi.mock('../repositories/course.repository', () => ({
  findCourseById:           vi.fn(),
  findCourses:              vi.fn(),
  findCourseWithModules:    vi.fn(),
  findCoursesByInstructor:  vi.fn(),
  createCourse:             vi.fn(),
  updateCourse:             vi.fn(),
  deleteCourseById:         vi.fn(),
  createModule:             vi.fn(),
  updateModule:             vi.fn(),
  deleteModuleById:         vi.fn(),
  createContentItem:        vi.fn(),
  updateContentItemById:    vi.fn(),
  deleteContentItemById:    vi.fn(),
}));

import { app } from '../app';
import * as enrollRepo from '../repositories/enrollment.repository';
import * as courseRepo from '../repositories/course.repository';

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-here-ok';

function makeToken(role = 'student', sub = 'user-uuid-1') {
  return jwt.sign({ sub, role, email: 'student@example.com' }, JWT_SECRET, { expiresIn: '1h' });
}

const mockEnrollRepo = vi.mocked(enrollRepo);
const mockCourseRepo = vi.mocked(courseRepo);

const COURSE_ID  = '00000000-0000-0000-0000-000000000001';
const USER_ID    = '00000000-0000-0000-0000-000000000002';
const ENROLL_ID  = '00000000-0000-0000-0000-000000000003';

const sampleEnrollment = {
  id: ENROLL_ID, user_id: USER_ID, course_id: COURSE_ID,
  progress_pct: 0, enrolled_at: new Date().toISOString(),
  title: 'TypeScript Avanzado', thumbnail_url: null, level: 'advanced',
};

const sampleCourse = {
  id: COURSE_ID, title: 'TypeScript Avanzado', slug: 'typescript-avanzado',
  is_published: true, level: 'advanced', instructor_id: USER_ID,
};

// ── GET /api/enrollments ──────────────────────────────────────────────────────

describe('GET /api/enrollments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/enrollments');
    expect(res.status).toBe(401);
  });

  it('returns enrollments list for authenticated user', async () => {
    mockEnrollRepo.findUserEnrollments.mockResolvedValueOnce([sampleEnrollment] as any);

    const res = await request(app)
      .get('/api/enrollments')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.enrollments).toHaveLength(1);
    expect(res.body.enrollments[0].title).toBe('TypeScript Avanzado');
  });
});

// ── POST /api/enrollments ─────────────────────────────────────────────────────

describe('POST /api/enrollments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .send({ courseId: COURSE_ID });
    expect(res.status).toBe(401);
  });

  it('returns 404 when course does not exist or is not published', async () => {
    mockCourseRepo.findCourseById.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ courseId: COURSE_ID });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/);
  });

  it('returns 201 on successful enrollment', async () => {
    mockCourseRepo.findCourseById.mockResolvedValueOnce(sampleCourse as any);
    mockEnrollRepo.enroll.mockResolvedValueOnce(sampleEnrollment as any);

    const res = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ courseId: COURSE_ID });

    expect(res.status).toBe(201);
    expect(res.body.enrollment.course_id).toBe(COURSE_ID);
  });

  it('returns 400 for invalid courseId (not a UUID)', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ courseId: 'not-a-uuid' });

    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/enrollments/:courseId ─────────────────────────────────────────

describe('DELETE /api/enrollments/:courseId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/enrollments/course-uuid-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when enrollment not found', async () => {
    mockEnrollRepo.unenroll.mockResolvedValueOnce(false);

    const res = await request(app)
      .delete('/api/enrollments/course-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it('returns 200 on successful unenroll', async () => {
    mockEnrollRepo.unenroll.mockResolvedValueOnce(true);

    const res = await request(app)
      .delete('/api/enrollments/course-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelada/);
  });
});
