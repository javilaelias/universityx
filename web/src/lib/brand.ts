// Marca configurable (white-label). Se lee en runtime desde el bloque BRAND_* del .env:
// cambiar la marca = reiniciar el contenedor, sin rebuild. Vacío o inválido → marca por defecto.
// Este módulo es puro (lo importan componentes cliente); getBrand() vive en brand-server.ts.

export interface Brand {
  name:         string;
  shortName:    string;
  tagline:      string;
  logoUrl:      string | null;   // null → ícono por defecto
  faviconUrl:   string;
  iconUrl:      string | null;   // null → íconos PWA de /public/icons
  footerText:   string | null;   // null → "<name> © <año>"
  primaryColor: string | null;   // null → paleta por defecto de globals.css
}

export const DEFAULT_BRAND: Brand = {
  name:         'Universidad X',
  shortName:    'UnivX',
  tagline:      'Plataforma de Aprendizaje Adaptativo',
  logoUrl:      null,
  faviconUrl:   '/favicon.ico',
  iconUrl:      null,
  footerText:   null,
  primaryColor: null,
};

export const DEFAULT_PRIMARY = '#16a34a';

function text(value: string | undefined, max = 120): string | null {
  const v = (value ?? '').replace(/[\r\n]+/g, ' ').trim();
  return v ? v.slice(0, max) : null;
}

// Ruta propia (/x; no //x ni /\x, que el navegador trata como otro host) o https://; lo demás se descarta.
export function brandUrl(value: string | undefined): string | null {
  const v = (value ?? '').trim();
  if (/^\/(?![/\\])[^\s\\]*$/.test(v)) return v;
  if (/^https:\/\/[^\s]+$/i.test(v)) return v;
  if (v) console.warn('[brand] URL ignorada (solo /ruta o https://):', v);
  return null;
}

export function brandColor(value: string | undefined): string | null {
  const v = (value ?? '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (v) console.warn('[brand] BRAND_PRIMARY_COLOR ignorado (formato #rrggbb):', v);
  return null;
}

export function readBrand(env: Record<string, string | undefined>): Brand {
  return {
    name:         text(env.BRAND_NAME) ?? DEFAULT_BRAND.name,
    shortName:    text(env.BRAND_SHORT_NAME, 12) ?? text(env.BRAND_NAME, 12) ?? DEFAULT_BRAND.shortName,
    tagline:      text(env.BRAND_TAGLINE) ?? DEFAULT_BRAND.tagline,
    logoUrl:      brandUrl(env.BRAND_LOGO_URL),
    faviconUrl:   brandUrl(env.BRAND_FAVICON_URL) ?? DEFAULT_BRAND.faviconUrl,
    iconUrl:      brandUrl(env.BRAND_ICON_URL),
    footerText:   text(env.BRAND_FOOTER_TEXT),
    primaryColor: brandColor(env.BRAND_PRIMARY_COLOR),
  };
}

const MIX: Record<number, [number, number]> = {
  // shade → [fracción de mezcla, destino: 255 blanco | 0 negro]
  50: [0.95, 255], 100: [0.9, 255], 200: [0.75, 255], 300: [0.6, 255], 400: [0.3, 255], 500: [0.15, 255],
  600: [0, 0], 700: [0.15, 0], 800: [0.3, 0], 900: [0.45, 0],
};

/** Escala brand-50…900 (tripletes "r g b") derivada del primario, que queda como 600. */
export function brandPalette(hex: string): Record<number, string> {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const out: Record<number, string> = {};
  for (const [shade, [f, to]] of Object.entries(MIX)) {
    out[Number(shade)] = rgb.map(c => Math.round(c + (to - c) * f)).join(' ');
  }
  return out;
}

/** CSS que sobreescribe las variables de la paleta; null si se usa la por defecto. */
export function brandPaletteCss(brand: Brand): string | null {
  if (!brand.primaryColor) return null;
  const vars = Object.entries(brandPalette(brand.primaryColor)).map(([s, v]) => `--brand-${s}:${v};`).join('');
  return `:root{${vars}}`;
}
