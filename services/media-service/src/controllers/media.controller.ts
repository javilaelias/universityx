import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { env } from '../config/env';
import { pool } from '../db/postgres';
import { transcodeQueue } from '../queues/transcode.queue';
import type { MediaJob } from '../types/media.types';

const originalsDir = join(env.MEDIA_STORAGE_PATH, 'originals');
mkdirSync(originalsDir, { recursive: true });

const ALLOWED_MIME = new Set([
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska',
]);

const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, originalsDir),
    filename:    (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: Number(env.MAX_UPLOAD_MB) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Formato de video no soportado (usa MP4, MOV, WebM o MKV)'));
      return;
    }
    cb(null, true);
  },
}).single('file');

// Envuelve multer para devolver 400 en vez de propagar al errorHandler genérico (500)
export function handleUpload(req: Request, res: Response, next: NextFunction): void {
  uploadMiddleware(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: (err as Error).message || 'Error al subir el archivo' });
      return;
    }
    next();
  });
}

export async function createUploadJob(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Archivo requerido (campo "file")' });
      return;
    }

    const result = await pool.query<{ id: string }>(
      `INSERT INTO media_jobs (uploader_id, original_filename, status)
       VALUES ($1, $2, 'queued') RETURNING id`,
      [req.user!.sub, req.file.originalname],
    );
    const mediaJobId = result.rows[0].id;

    await transcodeQueue.add('transcode', { mediaJobId, inputPath: req.file.path });

    res.status(202).json({ id: mediaJobId, status: 'queued' });
  } catch (err) {
    // Si falla tras haber guardado el archivo (p.ej. error de BD), evita huérfanos en disco
    if (req.file) await unlink(req.file.path).catch(() => {});
    next(err);
  }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<MediaJob>(
      `SELECT * FROM media_jobs WHERE id = $1`,
      [req.params.id],
    );
    const job = result.rows[0];
    if (!job) {
      res.status(404).json({ error: 'Job no encontrado' });
      return;
    }
    if (job.uploader_id !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Acceso no autorizado' });
      return;
    }

    res.json({
      id:              job.id,
      status:          job.status,
      hlsUrl:          job.hls_url,
      durationSeconds: job.duration_seconds,
      errorMessage:    job.error_message,
    });
  } catch (err) {
    next(err);
  }
}
