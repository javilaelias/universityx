'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '@/contexts/app-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Evita flash del tema oscuro al recargar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('ux-theme');
                var l = localStorage.getItem('ux-lang');
                if (t === 'dark') document.documentElement.classList.add('dark');
                if (l) document.documentElement.lang = l;
              } catch(_) {}
            `,
          }}
        />
        <title>Universidad X</title>
        <meta name="description" content="Plataforma de aprendizaje adaptativo" />
      </head>
      <body>
        <SessionProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
