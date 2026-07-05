import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/postgres', () => ({
  pool: { query: vi.fn() },
}));

vi.mock('../queues/transcode.queue', () => ({
  transcodeQueue: { add: vi.fn().mockResolvedValue(undefined) },
}));

import { app } from '../app';
import { pool } from '../db/postgres';
import { transcodeQueue } from '../queues/transcode.queue';

const mockPoolQuery = vi.mocked(pool.query);
const mockQueueAdd  = vi.mocked(transcodeQueue.add);

const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-here-ok';

function makeToken(sub = 'user-uuid-1', role = 'instructor') {
  return jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => vi.clearAllMocks());

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'media-service' });
  });
});

// ── POST /api/media/upload ─────────────────────────────────────────────────────

describe('POST /api/media/upload', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).post('/api/media/upload');
    expect(res.status).toBe(401);
  });

  it('rejects students (only instructor/admin may upload)', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${makeToken('u1', 'student')}`)
      .attach('file', Buffer.from('fake mp4 bytes'), { filename: 'clase.mp4', contentType: 'video/mp4' });
    expect(res.status).toBe(403);
  });

  it('rejects a request with no file attached', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('rejects unsupported video formats', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${makeToken()}`)
      .attach('file', Buffer.from('not a video'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid upload from an instructor and enqueues a transcode job', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'job-uuid-1' }], rowCount: 1 } as any);

    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${makeToken('instructor-1', 'instructor')}`)
      .attach('file', Buffer.from('fake mp4 bytes'), { filename: 'clase.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({ id: 'job-uuid-1', status: 'queued' });
    expect(mockQueueAdd).toHaveBeenCalledWith('transcode', expect.objectContaining({ mediaJobId: 'job-uuid-1' }));
  });
});

// ── GET /api/media/:id/status ──────────────────────────────────────────────────

const sampleJob = {
  id:                'job-uuid-1',
  uploader_id:       'instructor-1',
  original_filename: 'clase.mp4',
  status:            'completed',
  error_message:     null,
  duration_seconds:  754,
  hls_url:           'http://localhost:4008/media/hls/job-uuid-1/index.m3u8',
};

describe('GET /api/media/:id/status', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/media/job-uuid-1/status');
    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown job', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await request(app)
      .get('/api/media/unknown-id/status')
      .set('Authorization', `Bearer ${makeToken('instructor-1', 'instructor')}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when the requester is not the uploader nor an admin', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [sampleJob], rowCount: 1 } as any);
    const res = await request(app)
      .get('/api/media/job-uuid-1/status')
      .set('Authorization', `Bearer ${makeToken('other-instructor', 'instructor')}`);
    expect(res.status).toBe(403);
  });

  it('returns the job status for the uploader', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [sampleJob], rowCount: 1 } as any);
    const res = await request(app)
      .get('/api/media/job-uuid-1/status')
      .set('Authorization', `Bearer ${makeToken('instructor-1', 'instructor')}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'job-uuid-1', status: 'completed', hlsUrl: sampleJob.hls_url, durationSeconds: 754,
    });
  });

  it('allows an admin to view any job', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [sampleJob], rowCount: 1 } as any);
    const res = await request(app)
      .get('/api/media/job-uuid-1/status')
      .set('Authorization', `Bearer ${makeToken('admin-1', 'admin')}`);
    expect(res.status).toBe(200);
  });
});
