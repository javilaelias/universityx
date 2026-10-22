import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import type { Response } from 'express';
import { readBrand, DEFAULT_COLORS, DEFAULT_TAGLINE } from '../config/brand';
import { streamCertificatePDF } from '../lib/certificate-pdf';

const data = {
  recipientName: 'Ana', courseName: 'Curso', issuerName: 'Academia Sol',
  issuedAt: new Date('2026-10-21'), credentialId: '00000000-0000-0000-0000-000000000001', issuerUrl: 'https://x.test',
};

function renderPdf(brand: ReturnType<typeof readBrand>, issuerName = data.issuerName): Promise<Buffer> {
  const res = Object.assign(new PassThrough(), { setHeader: () => undefined }) as unknown as Response & PassThrough;
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  return new Promise(resolve => {
    res.on('end', () => resolve(Buffer.concat(chunks)));
    streamCertificatePDF(res, { ...data, issuerName }, brand);
  });
}

describe('marca del certificado', () => {
  it('sin BRAND_* usa los colores y textos actuales', () => {
    expect(readBrand({})).toEqual({ tagline: DEFAULT_TAGLINE, colors: DEFAULT_COLORS, footerText: null, logo: null });
  });

  it('deriva la paleta del color primario', () => {
    const b = readBrand({ BRAND_PRIMARY_COLOR: '#AA3300', BRAND_TAGLINE: 'Cursos\r\nde verano', BRAND_FOOTER_TEXT: 'Pie' });
    expect(b.colors.c600).toBe('#aa3300');
    expect(b.colors.c50).toBe('#fbf5f2');
    expect(b.colors.c900).toBe('#5e1c00');
    expect(b.tagline).toBe('Cursos de verano');
    expect(b.footerText).toBe('Pie');
  });

  it('ignora color inválido y logo inexistente o con otra extensión', () => {
    const b = readBrand({ BRAND_PRIMARY_COLOR: 'red', BRAND_LOGO_PATH: '/no/existe.png' });
    expect(b.colors).toEqual(DEFAULT_COLORS);
    expect(b.logo).toBeNull();
    expect(readBrand({ BRAND_LOGO_PATH: __filename }).logo).toBeNull();
  });

  it('genera el PDF con marca custom (logo y nombre largo) y con la default', async () => {
    // PNG 1×1 válido en un archivo temporal (el test no depende de otros paquetes).
    const logo = path.join(os.tmpdir(), `ux-brand-logo-${process.pid}.png`);
    fs.writeFileSync(logo, Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
    const b = readBrand({ BRAND_PRIMARY_COLOR: '#aa3300', BRAND_FOOTER_TEXT: 'Pie', BRAND_LOGO_PATH: logo });
    fs.unlinkSync(logo);
    expect(b.logo).not.toBeNull();
    const custom = await renderPdf(b, 'Instituto Superior Tecnológico de Educación Continua del Sur y del Norte');
    const def    = await renderPdf(readBrand({}));
    expect(custom.subarray(0, 4).toString()).toBe('%PDF');
    expect(def.subarray(0, 4).toString()).toBe('%PDF');
  });
});
