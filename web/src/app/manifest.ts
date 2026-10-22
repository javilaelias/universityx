import type { MetadataRoute } from 'next';
import { getBrand } from '@/lib/brand-server';
import { DEFAULT_PRIMARY } from '@/lib/brand';

// La marca se lee en runtime: sin esto el manifest se prerenderiza en el build con la marca default.
export const dynamic = 'force-dynamic';

const DEFAULT_ICONS: MetadataRoute.Manifest['icons'] = [
  { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
  { src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrand();
  const shortcutIcon = brand.iconUrl ?? '/icons/icon-192x192.png';
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: 'Plataforma de aprendizaje adaptativo',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#faf7f0',
    theme_color: brand.primaryColor ?? DEFAULT_PRIMARY,
    orientation: 'portrait-primary',
    categories: ['education'],
    lang: 'es',
    icons: brand.iconUrl
      ? [
          { src: brand.iconUrl, sizes: '192x192', type: 'image/png' },
          { src: brand.iconUrl, sizes: '512x512', type: 'image/png' },
        ]
      : DEFAULT_ICONS,
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: shortcutIcon, sizes: '192x192' }],
      },
      {
        name: 'Mis Cursos',
        short_name: 'Cursos',
        url: '/courses',
        icons: [{ src: shortcutIcon, sizes: '192x192' }],
      },
    ],
  };
}
