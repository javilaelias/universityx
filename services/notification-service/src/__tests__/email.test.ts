import { describe, it, expect } from 'vitest';
import { buildTemplate, escapeHtml } from '../templates/email.templates';
import { mailFrom, readBrand } from '../config/brand';
import { createMailTransport, isConsoleMode } from '../mail/transport';

const smtp = { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_USER: 'u', SMTP_PASS: 'p' };

describe('buildTemplate', () => {
  const data = { userName: 'Ana', courseTitle: 'SQL', subject: 'Login', ticketId: 7 };

  it.each(['enrollment.confirmed', 'ticket.created', 'ticket.reply', 'certificate.issued'])(
    '%s tiene versión ES y EN distintas',
    (event) => {
      const es = buildTemplate(event, data, 'es');
      const en = buildTemplate(event, data, 'en');
      expect(es.subject).not.toBe(en.subject);
      expect(es.html).toContain('Hola Ana');
      expect(en.html).toContain('Hi Ana');
    },
  );

  it('usa español por defecto y ante un locale desconocido', () => {
    expect(buildTemplate('enrollment.confirmed', data).subject).toContain('Bienvenido');
    expect(buildTemplate('enrollment.confirmed', data, 'fr').subject).toContain('Bienvenido');
  });

  it('certificado incluye enlace solo si es http(s)', () => {
    const ok = buildTemplate('certificate.issued', { ...data, certificateUrl: 'https://x.test/c/1' }, 'en');
    expect(ok.html).toContain('href="https://x.test/c/1"');
    const bad = buildTemplate('certificate.issued', { ...data, certificateUrl: 'javascript:alert(1)' }, 'en');
    expect(bad.html).not.toContain('href');
  });

  it('escapa HTML de los datos', () => {
    const t = buildTemplate('ticket.created', { ...data, userName: '<script>x</script>', subject: '"><img>' });
    expect(t.html).not.toContain('<script>');
    expect(t.html).not.toContain('<img>');
    expect(t.html).toContain('&lt;script&gt;');
  });

  it('quita saltos de línea del asunto', () => {
    expect(buildTemplate('ticket.reply', { subject: 'a\r\nBcc: x@y.z' }).subject).not.toMatch(/[\r\n]/);
  });

  it('evento desconocido o heredado del prototipo → plantilla genérica', () => {
    expect(buildTemplate('otro.evento', {}, 'en').subject).toBe('New notification from Universidad X');
    expect(buildTemplate('constructor', {}).inApp.title).toBe('Nueva notificación');
  });

  it('escapeHtml tolera null/undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(`&'`)).toBe('&amp;&#39;');
  });
});

describe('transporte de correo', () => {
  it('consola si SMTP_HOST está vacío o es "console"', () => {
    expect(isConsoleMode({ SMTP_HOST: '' })).toBe(true);
    expect(isConsoleMode({ SMTP_HOST: ' console ' })).toBe(true);
    expect(isConsoleMode({ SMTP_HOST: 'smtp.example.com' })).toBe(false);
  });

  it('modo consola serializa el correo sin conectarse', async () => {
    const info = await createMailTransport({ ...smtp, SMTP_HOST: '' })
      .sendMail({ from: 'a@x.test', to: 'b@x.test', subject: 'S', html: '<p>h</p>' });
    expect(JSON.parse((info as unknown as { message: string }).message).subject).toBe('S');
  });

  it('SMTP real con auth solo si hay usuario', () => {
    const withAuth = createMailTransport(smtp).options as { host: string; auth?: unknown; secure: boolean };
    expect(withAuth.host).toBe('smtp.example.com');
    expect(withAuth.auth).toEqual({ user: 'u', pass: 'p' });
    expect(withAuth.secure).toBe(false);

    const noAuth = createMailTransport({ ...smtp, SMTP_USER: '', SMTP_PORT: '465' }).options as { auth?: unknown; secure: boolean };
    expect(noAuth.auth).toBeUndefined();
    expect(noAuth.secure).toBe(true);
  });
});

describe('marca configurable', () => {
  const data = { userName: 'Ana', courseTitle: 'Curso', certificateUrl: 'https://x.test/c/1' };

  it('sin BRAND_* usa la marca actual', () => {
    const b = readBrand({});
    expect(b).toEqual({ name: 'Universidad X', logoUrl: null, primaryColor: '#16a34a', footerText: 'Universidad X' });
    const t = buildTemplate('auth.password_reset', {}, 'es', b);
    expect(t.subject).toBe('Restablece tu contraseña de Universidad X');
    expect(t.html).toContain('Universidad X</p>');
    expect(t.html).not.toContain('<img');
  });

  it('aplica nombre, logo, color y pie configurados', () => {
    const b = readBrand({
      BRAND_NAME: 'Academia Sol', BRAND_LOGO_URL: 'https://cdn.test/logo.png',
      BRAND_PRIMARY_COLOR: '#AA3300', BRAND_FOOTER_TEXT: 'Academia Sol · Lima',
    });
    expect(buildTemplate('otro.evento', {}, 'en', b).subject).toBe('New notification from Academia Sol');
    const t = buildTemplate('certificate.issued', data, 'es', b);
    expect(t.html).toContain('<img src="https://cdn.test/logo.png" alt="Academia Sol"');
    expect(t.html).toContain('<a style="color:#aa3300" href="https://x.test/c/1">');
    expect(t.html).toContain('Academia Sol · Lima</p>');
  });

  it('descarta logo no https, color inválido y escapa el pie', () => {
    const b = readBrand({ BRAND_LOGO_URL: 'javascript:alert(1)', BRAND_PRIMARY_COLOR: 'red;x', BRAND_FOOTER_TEXT: '<b>x</b>\r\nBcc' });
    expect(b.logoUrl).toBeNull();
    expect(b.primaryColor).toBe('#16a34a');
    expect(readBrand({ BRAND_LOGO_URL: '/brand/logo.png' }).logoUrl).toBeNull();
    const t = buildTemplate('ticket.created', data, 'es', b);
    expect(t.html).toContain('&lt;b&gt;x&lt;/b&gt; Bcc</p>');
    expect(t.html).not.toContain('<b>');
  });
});

describe('remitente', () => {
  it('usa SMTP_FROM si está y, si no, el nombre de la marca como objeto (nodemailer lo entrecomilla)', () => {
    const b = readBrand({ BRAND_NAME: 'Academia Sol, Lima' });
    expect(mailFrom('Otro <x@y.z>', b)).toBe('Otro <x@y.z>');
    expect(mailFrom('  ', b)).toEqual({ name: 'Academia Sol, Lima', address: 'no-reply@universidadx.com' });
  });
});
