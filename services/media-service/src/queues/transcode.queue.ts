import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import type { TranscodeJobData } from '../types/media.types';

export const transcodeQueue = new Queue<TranscodeJobData>('media-transcode', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:         1, // reintentar un transcode fallido a mano, no automático (evita duplicar trabajo de CPU)
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 50 },
  },
});
