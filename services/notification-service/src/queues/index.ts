import { Queue }        from 'bullmq';
import { redisConnection } from '../config/redis';

export interface NotificationJob {
  event:  string;
  userId: string;
  email:  string;
  data:   Record<string, unknown>;
  locale?: 'es' | 'en';
  inAppStored?: boolean;   // lo marca el worker tras guardar la notificación in-app
}

export const notificationQueue = new Queue<NotificationJob>('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:             3,
    backoff:              { type: 'exponential', delay: 3000 },
    removeOnComplete:     { count: 200 },
    removeOnFail:         { count: 50  },
  },
});
