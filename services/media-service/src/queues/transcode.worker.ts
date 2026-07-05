import { Worker } from 'bullmq';
import { unlink, rm } from 'fs/promises';
import { join } from 'path';
import { redisConnection } from '../config/redis';
import { env } from '../config/env';
import { pool } from '../db/postgres';
import { transcodeToHls } from '../lib/ffmpeg';
import type { TranscodeJobData } from '../types/media.types';

export function startTranscodeWorker() {
  const worker = new Worker<TranscodeJobData>(
    'media-transcode',
    async (job) => {
      const { mediaJobId, inputPath } = job.data;

      await pool.query(
        `UPDATE media_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
        [mediaJobId],
      );

      const outputDir = join(env.MEDIA_STORAGE_PATH, 'hls', mediaJobId);

      try {
        const { durationSeconds } = await transcodeToHls(inputPath, outputDir);
        const hlsUrl = `${env.MEDIA_EXTERNAL_URL}/media/hls/${mediaJobId}/index.m3u8`;

        await pool.query(
          `UPDATE media_jobs
           SET status = 'completed', hls_url = $2, duration_seconds = $3, updated_at = NOW()
           WHERE id = $1`,
          [mediaJobId, hlsUrl, durationSeconds],
        );
      } catch (err) {
        await pool.query(
          `UPDATE media_jobs SET status = 'failed', error_message = $2, updated_at = NOW() WHERE id = $1`,
          [mediaJobId, (err as Error).message?.slice(0, 2000) ?? 'Error desconocido'],
        );
        // Directorio de salida parcial/vacío tras un fallo — no sirve de nada, libera disco.
        await rm(outputDir, { recursive: true, force: true }).catch(() => {});
        throw err;
      } finally {
        // El original ya no se necesita una vez transcodificado (o fallido) — libera disco.
        await unlink(inputPath).catch(() => {});
      }
    },
    { connection: redisConnection, concurrency: 1 }, // transcoding es CPU-intensivo: un job a la vez
  );

  worker.on('completed', (job) => console.log(`[worker] ✓ transcode ${job.data.mediaJobId}`));
  worker.on('failed',    (job, err) => console.error(`[worker] ✗ transcode ${job?.data.mediaJobId}`, err.message));

  return worker;
}
