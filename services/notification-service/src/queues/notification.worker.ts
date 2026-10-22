import { Worker }          from 'bullmq';
import { pool }             from '../db/postgres';
import { redisConnection }  from '../config/redis';
import { env }              from '../config/env';
import { buildTemplate }    from '../templates/email.templates';
import { brand, mailFrom }   from '../config/brand';
import { createMailTransport, isConsoleMode } from '../mail/transport';
import { isEmailOnly, consoleLogView } from './events';
import { createPushSender, pushToUser } from '../push/fcm';
import type { NotificationJob } from './index';

const transporter = createMailTransport(env);
const consoleMode = isConsoleMode(env);
const pushSender  = createPushSender(env.FCM_CREDENTIALS_FILE);

export function startNotificationWorker() {
  const worker = new Worker<NotificationJob>(
    'notifications',
    async (job) => {
      const { event, userId, email, data, locale } = job.data;
      const template = buildTemplate(event, data, locale);

      // 1. Store in-app notification — una sola vez: si falla el SMTP, el reintento
      //    no la duplica; si falla el insert, el reintento la vuelve a intentar.
      //    Los eventos solo-email (secreto en `data`) no se guardan.
      if (!isEmailOnly(event) && !job.data.inAppStored) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, event.replace('.', '_'), template.inApp.title, template.inApp.body, data],
        );
        await job.updateData({ ...job.data, inAppStored: true });
      }

      // 2. Push FCM — best-effort y una sola vez: un fallo de FCM no reintenta el job
      //    (duplicaría el email). Nunca para eventos solo-email.
      if (pushSender && !isEmailOnly(event) && !job.data.pushSent) {
        try {
          await pushToUser(pushSender, (sql, params) => pool.query(sql, params), userId,
            { ...template.inApp, event });
        } catch (err) {
          console.error(`[push] ✗ ${event} → ${userId}`, (err as Error).message);
        }
        await job.updateData({ ...job.data, pushSent: true });
      }

      // 3. Send email
      const info = await transporter.sendMail({
        from:    mailFrom(env.SMTP_FROM, brand),
        to:      email,
        subject: template.subject,
        html:    template.html,
      });

      if (consoleMode) {
        // jsonTransport serialises the mail as JSON in info.message
        const raw = (info as unknown as { message: string }).message;
        console.log(`[email:${event}] → ${email}\n`, consoleLogView(event, JSON.parse(raw), env.NODE_ENV));
      }
    },
    { connection: redisConnection, concurrency: 5 },
  );

  worker.on('completed', job => console.log(`[worker] ✓ ${job.data.event} → ${job.data.userId}`));
  worker.on('failed',    (job, err) => console.error(`[worker] ✗ ${job?.data.event}`, err.message));

  return worker;
}
