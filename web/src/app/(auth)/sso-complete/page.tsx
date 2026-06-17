'use client';

import { Suspense, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function SsoCompleteContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      router.replace('/login?error=SSOFailed');
      return;
    }

    signIn('saml-code', { code, redirect: false }).then((result) => {
      router.replace(result?.error ? '/login?error=SSOFailed' : '/dashboard');
    });
  }, [params, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 to-slate-800">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-lg font-medium">Completando sesión institucional…</p>
        <p className="text-sm text-white/60">Redirigiendo al panel</p>
      </div>
    </div>
  );
}

export default function SsoCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-slate-800">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      }
    >
      <SsoCompleteContent />
    </Suspense>
  );
}
