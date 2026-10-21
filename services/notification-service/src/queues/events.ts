import type { JobsOptions } from 'bullmq';

// Eventos cuyo `data` lleva un secreto de un solo uso (p. ej. el enlace de reset con el token):
// no se guardan como notificación in-app, el job no se retiene en Redis y en producción
// el log del modo consola no muestra el cuerpo.
export const EMAIL_ONLY_EVENTS: ReadonlySet<string> = new Set(['auth.password_reset']);

export function isEmailOnly(event: string): boolean {
  return EMAIL_ONLY_EVENTS.has(event);
}

export function jobOptionsFor(event: string): JobsOptions {
  return isEmailOnly(event) ? { removeOnComplete: true, removeOnFail: true } : {};
}

// /trigger no tiene auth: sin esto cualquiera que llegue al puerto podría mandar un correo
// oficial de "restablece tu contraseña" con un enlace a otro sitio.
export function isAllowedResetUrl(url: unknown, webBaseUrl: string): boolean {
  const prefix = `${webBaseUrl.replace(/\/+$/, '')}/reset-password?token=`;
  return typeof url === 'string' && url.startsWith(prefix);
}

interface LoggedMail { to?: unknown; subject?: unknown; [k: string]: unknown }

export function consoleLogView(event: string, mail: LoggedMail, nodeEnv: string): LoggedMail {
  if (isEmailOnly(event) && nodeEnv === 'production') {
    return { to: mail.to, subject: mail.subject, html: '[redactado]' };
  }
  return mail;
}
