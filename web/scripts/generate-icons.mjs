// One-shot script: generates PWA icons from an inline SVG.
// Run once from web/: node scripts/generate-icons.mjs
// Requires: sharp (devDependency)
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const out = join(__dir, '..', 'public', 'icons');
mkdirSync(out, { recursive: true });

// Brand: green #16a34a on cream #faf7f0
const SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#16a34a"/>
  <text x="256" y="360" font-size="340" text-anchor="middle" dominant-baseline="auto"
    fill="#faf7f0" font-family="Arial,sans-serif" font-weight="bold">X</text>
</svg>`);

// Maskable variant: extra padding (safe zone = inner 80% of icon)
const SVG_MASKABLE = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#16a34a"/>
  <text x="256" y="340" font-size="260" text-anchor="middle" dominant-baseline="auto"
    fill="#faf7f0" font-family="Arial,sans-serif" font-weight="bold">X</text>
</svg>`);

const tasks = [
  { src: SVG,          size: 192, name: 'icon-192x192.png' },
  { src: SVG,          size: 512, name: 'icon-512x512.png' },
  { src: SVG,          size: 180, name: 'apple-touch-icon.png' },
  { src: SVG_MASKABLE, size: 192, name: 'icon-maskable-192x192.png' },
  { src: SVG_MASKABLE, size: 512, name: 'icon-maskable-512x512.png' },
  { src: SVG,          size: 48,  name: 'favicon-48.png' },
];

for (const { src, size, name } of tasks) {
  await sharp(src).resize(size, size).png().toFile(join(out, name));
  console.log(`  ✓ ${name}`);
}

// Also write favicon.ico as a 32×32 PNG (browsers accept PNG for favicon)
await sharp(SVG).resize(32, 32).png().toFile(join(__dir, '..', 'public', 'favicon.ico'));
console.log('  ✓ favicon.ico');

console.log('\nAll icons generated in public/icons/');
