import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/postgres', () => ({
  pool: { query: vi.fn() },
  connectPostgres: vi.fn().mockResolvedValue(undefined),
}));

// Mock pdfkit streaming so tests don't generate real PDFs
vi.mock('../lib/certificate-pdf', () => ({
  streamCertificatePDF: vi.fn().mockImplementation(
    (res: import('express').Response) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.end();
    },
  ),
}));

import { app } from '../app';
import { pool } from '../db/postgres';
import { streamCertificatePDF } from '../lib/certificate-pdf';

const mockPoolQuery = vi.mocked(pool.query);
const mockStreamPDF = vi.mocked(streamCertificatePDF);

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-here-ok';

function makeToken(sub = 'user-uuid-1', role = 'student') {
  return jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: '1h' });
}

const sampleRow = {
  id:           'badge-uuid-1',
  issued_at:    new Date().toISOString(),
  user_id:      'user-uuid-1',
  name:         'TypeScript Avanzado',
  description:  'Insignia por completar el curso',
  course_id:    'course-uuid-1',
  email:        'student@example.com',
  full_name:    'María García',
  course_title: 'TypeScript Avanzado',
};

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'credentials-service' });
  });
});

// ── GET /credentials/:id (badge JSON) ─────────────────────────────────────────

describe('GET /credentials/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for an unknown credential', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app).get('/credentials/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it('returns Open Badge JSON for a valid credential', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1 } as any);

    const res = await request(app).get('/credentials/badge-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'badge-uuid-1');
    expect(res.body).toHaveProperty('recipientName', 'María García');
    expect(res.body.credential).toHaveProperty('@context');
    expect(res.body.credential.type).toContain('OpenBadgeCredential');
  });
});

// ── GET /credentials/:id/pdf ──────────────────────────────────────────────────

describe('GET /credentials/:id/pdf', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for an unknown credential', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await request(app).get('/credentials/nonexistent-id/pdf');
    expect(res.status).toBe(404);
  });

  it('streams a PDF for a valid credential', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1 } as any);

    const res = await request(app).get('/credentials/badge-uuid-1/pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(mockStreamPDF).toHaveBeenCalledOnce();
    expect(mockStreamPDF).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        recipientName: 'María García',
        courseName:    'TypeScript Avanzado',
      }),
    );
  });
});

// ── GET /credentials (list — requires auth) ───────────────────────────────────

describe('GET /credentials', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without token', async () => {
    const res = await request(app).get('/credentials');
    expect(res.status).toBe(401);
  });

  it('returns credentials list for authenticated user', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1 } as any);

    const res = await request(app)
      .get('/credentials')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('credentials');
    expect(res.body.total).toBe(1);
  });
});

// ── POST /credentials ─────────────────────────────────────────────────────────

describe('POST /credentials', () => {
  beforeEach(() => vi.clearAllMocks());

  const USER   = '11111111-1111-1111-1111-111111111111';
  const OTHER  = '22222222-2222-2222-2222-222222222222';
  const COURSE = '33333333-3333-3333-3333-333333333333';
  const enrollmentRow = { progress_pct: '100.00', email: 'a@b.com', full_name: 'Ana', title: 'SQL', description: 'd' };

  // issueOne: matrícula → ya emitida → badge → user_badges → update
  function mockIssueOk() {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [enrollmentRow] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'badge-1' }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: 'ub-1', issued_at: '2026-10-21' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
  }

  it('requires auth', async () => {
    const res = await request(app).post('/credentials').send({});
    expect(res.status).toBe(401);
  });

  it('issues one course for the token user when userId is omitted', async () => {
    mockIssueOk();
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken(USER)}`).send({ courseId: COURSE });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userBadgeId', 'ub-1');
    expect(mockPoolQuery.mock.calls[0][1]).toEqual([USER, COURSE]);
  });

  it('forbids a non-admin from issuing to another user', async () => {
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken(USER)}`).send({ userId: OTHER, courseId: COURSE });
    expect(res.status).toBe(403);
    expect(mockPoolQuery).not.toHaveBeenCalled();
  });

  it('lets an admin issue to another user', async () => {
    mockIssueOk();
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken(USER, 'admin')}`).send({ userId: OTHER, courseId: COURSE });
    expect(res.status).toBe(201);
    expect(mockPoolQuery.mock.calls[0][1]).toEqual([OTHER, COURSE]);
  });

  it('claims every eligible enrollment when courseId is omitted', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ course_id: COURSE }] } as any);
    mockIssueOk();
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken(USER)}`).send({});
    expect(res.status).toBe(201);
    expect(res.body.issued).toHaveLength(1);
    expect(mockPoolQuery.mock.calls[0][1]).toEqual([USER]);
  });

  it('returns 422 when nothing is eligible', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] } as any);
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken(USER)}`).send({});
    expect(res.status).toBe(422);
  });

  it('rejects a malformed courseId', async () => {
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken(USER)}`).send({ courseId: 'nope' });
    expect(res.status).toBe(400);
  });
});

describe('POST /credentials — error de BD', () => {
  it('responde 500 en vez de dejar la promesa sin capturar', async () => {
    vi.clearAllMocks();
    mockPoolQuery.mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).post('/credentials')
      .set('Authorization', `Bearer ${makeToken('11111111-1111-1111-1111-111111111111')}`).send({});
    expect(res.status).toBe(500);
  });
});
