import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    navigateFallback: '/offline',
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      // _next/static assets (hashed filenames — immutable)
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-assets',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Cloudinary CDN (thumbnails de cursos)
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // API routes — Network First (excluye /api/auth/* que maneja NextAuth)
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-routes',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Páginas de la app — StaleWhileRevalidate
      {
        urlPattern: /^\/(dashboard|courses|profile|tickets|instructor).*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'pages',
          expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

// Headers de seguridad para todas las rutas. La CSP es mínima a propósito (sin script-src):
// Next inyecta scripts inline (y ThemeScript) que una CSP estricta sin nonces rompería.
const securityHeaders = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  // Solo tiene efecto servido por https (en http el navegador lo ignora).
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
};

export default withPWA(nextConfig);
