import nodemailer from 'nodemailer';

export interface SmtpConfig {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
}

// Sin SMTP_HOST (o con "console") los correos se escriben en el log en vez de enviarse.
export function isConsoleMode(cfg: Pick<SmtpConfig, 'SMTP_HOST'>): boolean {
  const host = cfg.SMTP_HOST.trim();
  return host === '' || host === 'console';
}

export function createMailTransport(cfg: SmtpConfig) {
  if (isConsoleMode(cfg)) return nodemailer.createTransport({ jsonTransport: true });

  const port = Number(cfg.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host:   cfg.SMTP_HOST.trim(),
    port,
    secure: port === 465,
    // Auth solo si hay usuario: un relay interno sin credenciales también funciona.
    ...(cfg.SMTP_USER ? { auth: { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS } } : {}),
  });
}
