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
