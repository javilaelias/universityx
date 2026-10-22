// Marca configurable (bloque BRAND_* del .env). Vacío o inválido → marca por defecto.
// Lee process.env directo (sin el schema de env.ts) para que las plantillas sean puras en tests.

export interface Brand {
  name:         string;
  logoUrl:      string | null;  // solo https:// (una ruta relativa no sirve en un correo)
  primaryColor: string;
  footerText:   string;
}

export const DEFAULT_BRAND_NAME = 'Universidad X';
export const DEFAULT_PRIMARY    = '#16a34a';

function text(value: string | undefined): string | null {
  const v = (value ?? '').replace(/[\r\n]+/g, ' ').trim();
  return v ? v.slice(0, 120) : null;
}

export function readBrand(env: Record<string, string | undefined> = process.env): Brand {
  const name  = text(env.BRAND_NAME) ?? DEFAULT_BRAND_NAME;
  const logo  = (env.BRAND_LOGO_URL ?? '').trim();
  const color = (env.BRAND_PRIMARY_COLOR ?? '').trim();
  return {
    name,
    logoUrl:      /^https:\/\/[^\s]+$/i.test(logo) ? logo : null,
    primaryColor: /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_PRIMARY,
    footerText:   text(env.BRAND_FOOTER_TEXT) ?? name,
  };
}

export const DEFAULT_FROM_ADDRESS = 'no-reply@universidadx.com';

/** Remitente: SMTP_FROM si está; si no, el nombre de la marca (nodemailer lo entrecomilla). */
export function mailFrom(smtpFrom: string, b: Brand): string | { name: string; address: string } {
  return smtpFrom.trim() || { name: b.name, address: DEFAULT_FROM_ADDRESS };
}

export const brand = readBrand();
