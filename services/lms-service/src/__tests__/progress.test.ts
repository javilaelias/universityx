import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/postgres', () => ({
  pool:            { query: vi.fn() },
  query:           vi.fn().mockResolvedValue({ rows: [{ course_id: '00000000-0000-0000-0000-000000000001' }] }),
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
  updateProgressPct: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../repositories/progress.repository', () => ({
  upsertProgress: vi.fn().mockResolvedValue({ id: 'p1', completed: true }),
}));
vi.mock('../repositories/course.repository', () => ({
  findContentById: vi.fn(),
}));

import { app } from '../app';
import * as courseRepo from '../repositories/course.repository';
import * as progressRepo from '../repositories/progress.repository';
import * as enrollRepo from '../repositories/enrollment.repository';

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-here-ok';
const token = jwt.sign({ sub: 'user-uuid-1', role: 'student', email: 's@e.com' }, JWT_SECRET, { expiresIn: '1h' });
const ITEM = '00000000-0000-0000-0000-0000000000c1';

describe('POST /api/progress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no deja marcar un quiz como completado (solo aprobándolo)', async () => {
    vi.mocked(courseRepo.findContentById).mockResolvedValueOnce({ id: ITEM, type: 'quiz' } as any);
    const res = await request(app).post('/api/progress')
      .set('Authorization', `Bearer ${token}`).send({ contentItemId: ITEM, completed: true });
    expect(res.status).toBe(422);
    expect(progressRepo.upsertProgress).not.toHaveBeenCalled();
  });

  it('marca un video y recalcula el % antes de responder', async () => {
    vi.mocked(courseRepo.findContentById).mockResolvedValueOnce({ id: ITEM, type: 'video' } as any);
    const res = await request(app).post('/api/progress')
      .set('Authorization', `Bearer ${token}`).send({ contentItemId: ITEM, completed: true });
    expect(res.status).toBe(200);
    expect(enrollRepo.updateProgressPct).toHaveBeenCalledWith('user-uuid-1', '00000000-0000-0000-0000-000000000001');
  });
});
