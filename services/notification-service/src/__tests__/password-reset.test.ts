import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  processor: undefined as undefined | ((job: unknown) => Promise<void>),
  poolQuery: vi.fn(),
  sendMail:  vi.fn(),
}));

vi.mock('bullmq', () => ({
  Worker: class {
    constructor(_name: string, fn: (job: unknown) => Promise<void>) { h.processor = fn; }
    on() { return this; }
  },
}));
vi.mock('../config/env', () => ({
  env: { SMTP_HOST: 'console', SMTP_PORT: '587', SMTP_USER: '', SMTP_PASS: '', SMTP_FROM: 'x@x.test', NODE_ENV: 'production' },
}));
vi.mock('../config/redis', () => ({ redisConnection: {} }));
vi.mock('../db/postgres', () => ({ pool: { query: h.poolQuery } }));
vi.mock('../mail/transport', () => ({
  createMailTransport: () => ({ sendMail: h.sendMail }),
  isConsoleMode:       () => true,
}));

import { startNotificationWorker } from '../queues/notification.worker';
import { buildTemplate } from '../templates/email.templates';
import { isEmailOnly, jobOptionsFor, consoleLogView, isAllowedResetUrl } from '../queues/events';

const resetUrl = 'https://app.test/reset-password?token=SECRET123';

function job(event: string, data: Record<string, unknown> = {}) {
  return {
    data: { event, userId: 'u1', email: 'a@x.test', data, locale: 'es' },
    updateData: vi.fn(),
  };
}

describe('auth.password_reset', () => {
  it('plantillas ES/EN con enlace http(s) y vencimiento', () => {
    const es = buildTemplate('auth.password_reset', { userName: 'Ana', resetUrl, expiresMinutes: 30 }, 'es');
    const en = buildTemplate('auth.password_reset', { userName: 'Ana', resetUrl, expiresMinutes: 30 }, 'en');
    expect(es.subject).toContain('Restablece');
    expect(en.subject).toContain('Reset');
    expect(es.html).toContain(`href="${resetUrl}"`);
    expect(en.html).toContain('30 minutes');
    const bad = buildTemplate('auth.password_reset', { resetUrl: 'javascript:alert(1)' }, 'es');
    expect(bad.html).not.toContain('href');
  });

  it('es solo-email y su job no se retiene; los demás eventos sí', () => {
    expect(isEmailOnly('auth.password_reset')).toBe(true);
    expect(isEmailOnly('ticket.created')).toBe(false);
    expect(jobOptionsFor('auth.password_reset')).toEqual({ removeOnComplete: true, removeOnFail: true });
    expect(jobOptionsFor('ticket.created')).toEqual({});
  });

  it('resetUrl solo puede apuntar a /reset-password de la web configurada', () => {
    const base = 'https://app.test/';
    expect(isAllowedResetUrl(resetUrl, base)).toBe(true);
    expect(isAllowedResetUrl('https://app.test.evil.com/reset-password?token=x', base)).toBe(false);
    expect(isAllowedResetUrl('https://evil.com/?r=https://app.test/reset-password?token=x', base)).toBe(false);
    expect(isAllowedResetUrl('https://app.test/otra?token=x', base)).toBe(false);
    expect(isAllowedResetUrl(undefined, base)).toBe(false);
  });

  it('el log de consola redacta el cuerpo solo en producción', () => {
    const mail = { to: 'a@x.test', subject: 'S', html: resetUrl };
    expect(JSON.stringify(consoleLogView('auth.password_reset', mail, 'production'))).not.toContain('SECRET123');
    expect(consoleLogView('auth.password_reset', mail, 'development')).toBe(mail);
    expect(consoleLogView('ticket.created', mail, 'production')).toBe(mail);
  });
});

describe('worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.sendMail.mockResolvedValue({ message: JSON.stringify({ to: 'a@x.test', subject: 'S', html: resetUrl }) });
    h.poolQuery.mockResolvedValue({ rows: [] });
    startNotificationWorker();
  });

  it('evento solo-email: envía sin guardar in-app y sin loguear el token', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await h.processor!(job('auth.password_reset', { resetUrl }));
    expect(h.poolQuery).not.toHaveBeenCalled();
    expect(h.sendMail).toHaveBeenCalledOnce();
    expect(JSON.stringify(log.mock.calls)).not.toContain('SECRET123');
    log.mockRestore();
  });

  it('eventos existentes siguen guardando la notificación in-app', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await h.processor!(job('ticket.created', { subject: 'Login' }));
    expect(h.poolQuery).toHaveBeenCalledOnce();
    expect(h.sendMail).toHaveBeenCalledOnce();
  });
});
