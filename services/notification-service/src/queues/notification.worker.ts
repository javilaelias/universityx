import { Worker }          from 'bullmq';
import nodemailer           from 'nodemailer';
import { pool }             from '../db/postgres';
import { redisConnection }  from '../config/redis';
import { env }              from '../config/env';
import { buildTemplate }    from '../templates/email.templates';
import type { NotificationJob } from './index';

const transporter = env.SMTP_HOST === 'console'
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   Number(env.SMTP_PORT),
      auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
      secure: Number(env.SMTP_PORT) === 465,
    });

export function startNotificationWorker() {
  const worker = new Worker<NotificationJob>(
    'notifications',
    async (job) => {
      const { event, userId, email, data } = job.data;
      const template = buildTemplate(event as Parameters<typeof buildTemplate>[0], data);

      // 1. Store in-app notification
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, event.replace('.', '_'), template.inApp.title, template.inApp.body, data],
      );

      // 2. Send email
      const info = await transporter.sendMail({
        from:    env.SMTP_FROM,
        to:      email,
        subject: template.subject,
        html:    template.html,
      });

      if (env.SMTP_HOST === 'console') {
        // jsonTransport serialises the mail as JSON in info.message
        const raw = (info as unknown as { message: string }).message;
        console.log(`[email:${event}] → ${email}\n`, JSON.parse(raw));
      }
    },
    { connection: redisConnection, concurrency: 5 },
  );

  worker.on('completed', job => console.log(`[worker] ✓ ${job.data.event} → ${job.data.userId}`));
  worker.on('failed',    (job, err) => console.error(`[worker] ✗ ${job?.data.event}`, err.message));

  return worker;
}
