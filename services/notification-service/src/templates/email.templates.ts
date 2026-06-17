export type NotificationEvent =
  | 'enrollment.confirmed'
  | 'quiz.passed'
  | 'quiz.failed'
  | 'ticket.created'
  | 'ticket.reply'
  | 'live_session.reminder';

interface EmailTemplate {
  subject: string;
  html:    string;
  inApp:   { title: string; body: string };
}

export function buildTemplate(event: NotificationEvent, data: Record<string, unknown>): EmailTemplate {
  switch (event) {
    case 'enrollment.confirmed':
      return {
        subject: `¡Bienvenido al curso "${data.courseTitle}"!`,
        html:    `<p>Hola ${data.userName},</p><p>Tu matrícula en <strong>${data.courseTitle}</strong> fue confirmada. ¡Empieza a aprender ahora!</p>`,
        inApp:   { title: '¡Matriculado!', body: `Bienvenido a "${data.courseTitle}"` },
      };

    case 'quiz.passed':
      return {
        subject: `¡Aprobaste el quiz "${data.quizTitle}" con ${data.score}%!`,
        html:    `<p>Hola ${data.userName},</p><p>Obtuviste <strong>${data.score}%</strong> en el quiz "<strong>${data.quizTitle}</strong>". ¡Felicidades!</p>`,
        inApp:   { title: `Quiz aprobado — ${data.score}%`, body: `Pasaste "${data.quizTitle}"` },
      };

    case 'quiz.failed':
      return {
        subject: `Quiz "${data.quizTitle}": sigue intentando`,
        html:    `<p>Hola ${data.userName},</p><p>Obtuviste <strong>${data.score}%</strong>. El puntaje mínimo es ${data.passingScore}%. Puedes intentarlo de nuevo.</p>`,
        inApp:   { title: 'Quiz: sigue intentando', body: `Obtuviste ${data.score}% en "${data.quizTitle}"` },
      };

    case 'ticket.created':
      return {
        subject: `Ticket #${data.ticketId} recibido — ${data.subject}`,
        html:    `<p>Hola ${data.userName},</p><p>Tu ticket de soporte "<strong>${data.subject}</strong>" fue recibido. Te responderemos pronto.</p>`,
        inApp:   { title: 'Ticket de soporte creado', body: `"${data.subject}" está siendo revisado` },
      };

    case 'ticket.reply':
      return {
        subject: `Nueva respuesta en tu ticket: ${data.subject}`,
        html:    `<p>Hola ${data.userName},</p><p>El equipo de soporte respondió tu ticket "<strong>${data.subject}</strong>".</p>`,
        inApp:   { title: 'Respuesta a tu ticket', body: `Tienes una nueva respuesta en "${data.subject}"` },
      };

    case 'live_session.reminder':
      return {
        subject: `Recordatorio: sesión en vivo "${data.sessionTitle}" en 30 min`,
        html:    `<p>Hola ${data.userName},</p><p>La sesión "<strong>${data.sessionTitle}</strong>" empieza en 30 minutos.</p><p><a href="${data.meetingUrl}">Únete aquí</a></p>`,
        inApp:   { title: 'Sesión en vivo en 30 min', body: `"${data.sessionTitle}" comienza pronto` },
      };
  }
}
