'use client';

import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '@/contexts/app-context';
import SessionKeeper from '@/components/SessionKeeper';

export default function Providers({ children }: { children: React.ReactNode }) {
  // El refetch al foco lo hace SessionKeeper (evita la carrera GET/POST de la cookie).
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionKeeper />
      <AppProvider>
        {children}
      </AppProvider>
    </SessionProvider>
  );
}
