// Marca configurable del certificado (bloque BRAND_* del .env). Vacío o inválido → marca actual.
// El nombre del emisor sigue siendo ISSUER_NAME (en compose cae a BRAND_NAME).
import fs from 'node:fs';

export interface BrandColors { c50: string; c200: string; c600: string; c900: string }

export interface Brand {
  tagline:    string;
  colors:     BrandColors;
  footerText: string | null;   // null → ISSUER_NAME
  logo:       Buffer | null;   // PNG/JPEG local (BRAND_LOGO_PATH) leído una vez; null → sin logo
}

// Hex actuales del certificado (verde Universidad X).
export const DEFAULT_COLORS: BrandColors = { c50: '#f0fdf4', c200: '#bbf7d0', c600: '#16a34a', c900: '#14532d' };
export const DEFAULT_TAGLINE = 'Plataforma de Aprendizaje Adaptativo';

function text(value: string | undefined): string | null {
  const v = (value ?? '').replace(/[\r\n]+/g, ' ').trim();
  return v ? v.slice(0, 120) : null;
}

// Misma derivación que la web (web/src/lib/brand.ts): el primario es el 600.
function mix(hex: string, to: number, f: number): string {
  const out = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(c + (to - c) * f).toString(16).padStart(2, '0');
  });
  return `#${out.join('')}`;
}

export function readBrand(env: Record<string, string | undefined> = process.env): Brand {
  const color = (env.BRAND_PRIMARY_COLOR ?? '').trim().toLowerCase();
  const colors = /^#[0-9a-f]{6}$/.test(color)
    ? { c50: mix(color, 255, 0.95), c200: mix(color, 255, 0.75), c600: color, c900: mix(color, 0, 0.45) }
    : DEFAULT_COLORS;

  const logo = (env.BRAND_LOGO_PATH ?? '').trim();
  let logoBuf: Buffer | null = null;
  if (logo) {
    if (/\.(png|jpe?g)$/i.test(logo) && fs.existsSync(logo)) logoBuf = fs.readFileSync(logo);
    else console.warn('[brand] BRAND_LOGO_PATH ignorado (PNG/JPEG existente):', logo);
  }

  return {
    tagline:    text(env.BRAND_TAGLINE) ?? DEFAULT_TAGLINE,
    colors,
    footerText: text(env.BRAND_FOOTER_TEXT),
    logo:       logoBuf,
  };
}

export const brand = readBrand();
