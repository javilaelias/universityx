'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { Suspense } from 'react';
import { useLang } from '@/contexts/app-context';

// ── Iconos SVG inline ─────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}

// ── Contenido ─────────────────────────────────────────────────────────────────

function LoginContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { t }       = useLang();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [show,       setShow]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showSaml,   setShowSaml]   = useState(false);
  const [samlEmail,  setSamlEmail]  = useState('');

  const registeredMsg = params.get('registered') === '1'
    ? t('login.registered')
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      rememberMe: rememberMe ? '1' : '0',
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t('login.error'));
    } else {
      router.push('/dashboard');
    }
  }

  function handleSaml(e: React.FormEvent) {
    e.preventDefault();
    const domain = samlEmail.includes('@') ? samlEmail.split('@')[1] : samlEmail;
    if (!domain) return;
    window.location.href = `/api/auth/saml-init?institution=${encodeURIComponent(domain)}`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Universidad X</h1>
            <p className="mt-1 text-sm text-gray-500">{t('login.subtitle')}</p>
          </div>
        </div>

        {registeredMsg && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            {registeredMsg}
          </p>
        )}

        {/* Form credentials */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('login.email')}
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              {t('login.remember')}
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        {/* SSO divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2 dark:bg-slate-900">{t('login.or')}</span>
          </div>
        </div>

        {/* OIDC: Google + Microsoft */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="btn-ghost flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-sm"
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
            className="btn-ghost flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-sm"
          >
            <MicrosoftIcon />
            Microsoft
          </button>
        </div>

        {/* SAML institucional */}
        {showSaml ? (
          <form onSubmit={handleSaml} className="space-y-2">
            <input
              type="email"
              required
              autoFocus
              value={samlEmail}
              onChange={e => setSamlEmail(e.target.value)}
              placeholder={t('login.sso_email')}
              className="input"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaml(false)}
                className="btn-ghost flex-1 border border-gray-200 dark:border-slate-700 text-sm"
              >
                {t('login.sso_cancel')}
              </button>
              <button type="submit" className="btn-primary flex-1 text-sm">
                {t('login.sso_cont')}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowSaml(true)}
            className="btn-ghost w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-sm"
          >
            <Building2 className="h-4 w-4" />
            {t('login.sso_inst')}
          </button>
        )}

        <p className="text-center text-sm text-gray-500">
          {t('login.no_account')}{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            {t('login.register')}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400">
          Universidad X © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
