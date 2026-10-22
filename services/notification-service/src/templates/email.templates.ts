import { brand as defaultBrand, type Brand } from '../config/brand';

export type NotificationEvent =
  | 'enrollment.confirmed'
  | 'quiz.passed'
  | 'quiz.failed'
  | 'ticket.created'
  | 'ticket.reply'
  | 'live_session.reminder'
  | 'certificate.issued'
  | 'auth.password_reset';

export type Locale = 'es' | 'en';
export const LOCALES = ['es', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'es';

interface EmailTemplate {
  subject: string;
  html:    string;
  inApp:   { title: string; body: string };
}

type Data    = Record<string, unknown>;
type Builder = (d: Data, b: Brand) => EmailTemplate;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, ch => ESCAPES[ch]);
}

// Solo enlaces http(s); cualquier otro esquema (javascript:, data:) se descarta.
function safeUrl(value: unknown): string {
  const url = String(value ?? '').trim();
  return /^https?:\/\//i.test(url) ? escapeHtml(url) : '';
}

// Asunto e in-app son texto plano (no HTML): sin escape, pero sin saltos de línea.
function text(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ');
}

const link = (url: string, label: string) => (url ? `<p><a href="${url}">${label}</a></p>` : '');

// Envoltura de marca: logo opcional arriba, color primario en enlaces y pie gris.
function wrap(html: string, b: Brand): string {
  const color = escapeHtml(b.primaryColor);
  const logo  = b.logoUrl ? `<p><img src="${escapeHtml(b.logoUrl)}" alt="${escapeHtml(b.name)}" style="max-height:48px"></p>` : '';
  const body  = html.replace(/<a href=/g, `<a style="color:${color}" href=`);
  return `${logo}${body}<p style="color:#888888;font-size:12px">${escapeHtml(b.footerText)}</p>`;
}

const TEMPLATES: Record<Locale, Record<NotificationEvent, Builder>> = {
  es: {
    'enrollment.confirmed': d => ({
      subject: `¡Bienvenido al curso "${text(d.courseTitle)}"!`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>Tu matrícula en <strong>${escapeHtml(d.courseTitle)}</strong> fue confirmada. ¡Empieza a aprender ahora!</p>`,
      inApp:   { title: '¡Matriculado!', body: `Bienvenido a "${text(d.courseTitle)}"` },
    }),
    'quiz.passed': d => ({
      subject: `¡Aprobaste el quiz "${text(d.quizTitle)}" con ${text(d.score)}%!`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>Obtuviste <strong>${escapeHtml(d.score)}%</strong> en el quiz "<strong>${escapeHtml(d.quizTitle)}</strong>". ¡Felicidades!</p>`,
      inApp:   { title: `Quiz aprobado — ${text(d.score)}%`, body: `Pasaste "${text(d.quizTitle)}"` },
    }),
    'quiz.failed': d => ({
      subject: `Quiz "${text(d.quizTitle)}": sigue intentando`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>Obtuviste <strong>${escapeHtml(d.score)}%</strong>. El puntaje mínimo es ${escapeHtml(d.passingScore)}%. Puedes intentarlo de nuevo.</p>`,
      inApp:   { title: 'Quiz: sigue intentando', body: `Obtuviste ${text(d.score)}% en "${text(d.quizTitle)}"` },
    }),
    'ticket.created': d => ({
      subject: `Ticket #${text(d.ticketId)} recibido — ${text(d.subject)}`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>Tu ticket de soporte "<strong>${escapeHtml(d.subject)}</strong>" fue recibido. Te responderemos pronto.</p>`,
      inApp:   { title: 'Ticket de soporte creado', body: `"${text(d.subject)}" está siendo revisado` },
    }),
    'ticket.reply': d => ({
      subject: `Nueva respuesta en tu ticket: ${text(d.subject)}`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>El equipo de soporte respondió tu ticket "<strong>${escapeHtml(d.subject)}</strong>".</p>`,
      inApp:   { title: 'Respuesta a tu ticket', body: `Tienes una nueva respuesta en "${text(d.subject)}"` },
    }),
    'live_session.reminder': d => ({
      subject: `Recordatorio: sesión en vivo "${text(d.sessionTitle)}" en 30 min`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>La sesión "<strong>${escapeHtml(d.sessionTitle)}</strong>" empieza en 30 minutos.</p>${link(safeUrl(d.meetingUrl), 'Únete aquí')}`,
      inApp:   { title: 'Sesión en vivo en 30 min', body: `"${text(d.sessionTitle)}" comienza pronto` },
    }),
    'certificate.issued': d => ({
      subject: `Tu certificado de "${text(d.courseTitle)}" está listo`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>Completaste <strong>${escapeHtml(d.courseTitle)}</strong> y tu certificado fue emitido. ¡Felicidades!</p>${link(safeUrl(d.certificateUrl), 'Ver certificado')}`,
      inApp:   { title: 'Certificado emitido', body: `Tu certificado de "${text(d.courseTitle)}" está disponible` },
    }),
    'auth.password_reset': (d, b) => ({
      subject: `Restablece tu contraseña de ${text(b.name)}`,
      html:    `<p>Hola ${escapeHtml(d.userName)},</p><p>Recibimos una solicitud para restablecer tu contraseña. El enlace vence en ${escapeHtml(d.expiresMinutes)} minutos y sirve una sola vez.</p>${link(safeUrl(d.resetUrl), 'Restablecer contraseña')}<p>Si no fuiste tú, ignora este correo: tu contraseña no cambia.</p>`,
      inApp:   { title: 'Restablecer contraseña', body: 'Revisa tu correo' },
    }),
  },
  en: {
    'enrollment.confirmed': d => ({
      subject: `Welcome to "${text(d.courseTitle)}"!`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>Your enrollment in <strong>${escapeHtml(d.courseTitle)}</strong> is confirmed. Start learning now!</p>`,
      inApp:   { title: 'Enrolled!', body: `Welcome to "${text(d.courseTitle)}"` },
    }),
    'quiz.passed': d => ({
      subject: `You passed "${text(d.quizTitle)}" with ${text(d.score)}%!`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>You scored <strong>${escapeHtml(d.score)}%</strong> on the quiz "<strong>${escapeHtml(d.quizTitle)}</strong>". Congratulations!</p>`,
      inApp:   { title: `Quiz passed — ${text(d.score)}%`, body: `You passed "${text(d.quizTitle)}"` },
    }),
    'quiz.failed': d => ({
      subject: `Quiz "${text(d.quizTitle)}": keep trying`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>You scored <strong>${escapeHtml(d.score)}%</strong>. The passing score is ${escapeHtml(d.passingScore)}%. You can try again.</p>`,
      inApp:   { title: 'Quiz: keep trying', body: `You scored ${text(d.score)}% on "${text(d.quizTitle)}"` },
    }),
    'ticket.created': d => ({
      subject: `Ticket #${text(d.ticketId)} received — ${text(d.subject)}`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>We received your support ticket "<strong>${escapeHtml(d.subject)}</strong>". We will get back to you soon.</p>`,
      inApp:   { title: 'Support ticket created', body: `"${text(d.subject)}" is being reviewed` },
    }),
    'ticket.reply': d => ({
      subject: `New reply on your ticket: ${text(d.subject)}`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>The support team replied to your ticket "<strong>${escapeHtml(d.subject)}</strong>".</p>`,
      inApp:   { title: 'Reply to your ticket', body: `You have a new reply on "${text(d.subject)}"` },
    }),
    'live_session.reminder': d => ({
      subject: `Reminder: live session "${text(d.sessionTitle)}" in 30 min`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>The session "<strong>${escapeHtml(d.sessionTitle)}</strong>" starts in 30 minutes.</p>${link(safeUrl(d.meetingUrl), 'Join here')}`,
      inApp:   { title: 'Live session in 30 min', body: `"${text(d.sessionTitle)}" starts soon` },
    }),
    'certificate.issued': d => ({
      subject: `Your certificate for "${text(d.courseTitle)}" is ready`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>You completed <strong>${escapeHtml(d.courseTitle)}</strong> and your certificate has been issued. Congratulations!</p>${link(safeUrl(d.certificateUrl), 'View certificate')}`,
      inApp:   { title: 'Certificate issued', body: `Your certificate for "${text(d.courseTitle)}" is available` },
    }),
    'auth.password_reset': (d, b) => ({
      subject: `Reset your ${text(b.name)} password`,
      html:    `<p>Hi ${escapeHtml(d.userName)},</p><p>We received a request to reset your password. The link expires in ${escapeHtml(d.expiresMinutes)} minutes and works only once.</p>${link(safeUrl(d.resetUrl), 'Reset password')}<p>If this wasn't you, ignore this email: your password stays the same.</p>`,
      inApp:   { title: 'Reset password', body: 'Check your email' },
    }),
  },
};

const GENERIC: Record<Locale, Builder> = {
  es: (_d, b) => ({
    subject: `Nueva notificación de ${text(b.name)}`,
    html:    `<p>Tienes una nueva notificación en ${escapeHtml(b.name)}.</p>`,
    inApp:   { title: 'Nueva notificación', body: 'Tienes una nueva notificación' },
  }),
  en: (_d, b) => ({
    subject: `New notification from ${text(b.name)}`,
    html:    `<p>You have a new notification on ${escapeHtml(b.name)}.</p>`,
    inApp:   { title: 'New notification', body: 'You have a new notification' },
  }),
};

// Evento desconocido → plantilla genérica; locale desconocido → español.
export function buildTemplate(
  event: string, data: Data, locale: string = DEFAULT_LOCALE, b: Brand = defaultBrand,
): EmailTemplate {
  const lang: Locale = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : DEFAULT_LOCALE;
  const byEvent = TEMPLATES[lang] as Record<string, Builder>;
  const builder = Object.prototype.hasOwnProperty.call(byEvent, event) ? byEvent[event] : GENERIC[lang];
  const tpl = builder(data, b);
  return { ...tpl, html: wrap(tpl.html, b) };
}
