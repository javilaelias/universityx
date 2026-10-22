import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { ThemeScript } from '@/components/ThemeScript';
import { BrandProvider } from '@/contexts/brand-context';
import { getBrand } from '@/lib/brand-server';
import { brandPaletteCss, DEFAULT_PRIMARY } from '@/lib/brand';

export function generateMetadata(): Metadata {
  const brand = getBrand();
  return {
    title: brand.name,
    description: 'Plataforma de aprendizaje adaptativo',
    applicationName: brand.name,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: brand.name,
    },
    formatDetection: { telephone: false },
  };
}

export function generateViewport(): Viewport {
  const brand = getBrand();
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: brand.primaryColor ?? DEFAULT_PRIMARY },
      { media: '(prefers-color-scheme: dark)',  color: '#0b1612' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = getBrand();
  const paletteCss = brandPaletteCss(brand);
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Solo números generados por brandPalette (sin texto del operador). */}
        {paletteCss && <style dangerouslySetInnerHTML={{ __html: paletteCss }} />}
        <link rel="apple-touch-icon" href={brand.iconUrl ?? '/icons/apple-touch-icon.png'} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href={brand.faviconUrl} sizes="any" />
      </head>
      <body>
        <BrandProvider brand={brand}>
          <Providers>
            {children}
          </Providers>
        </BrandProvider>
      </body>
    </html>
  );
}
