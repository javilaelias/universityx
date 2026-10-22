'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/app-context';
import { passwordPolicyError, failedPassword } from '@/lib/password-policy';

function ResetPasswordContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { t }   = useLang();
  const read    = useRef(false);

  // undefined = leyendo la URL · null = sin token
  const [token,    setToken]    = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Toma el token una sola vez y lo quita de la URL (historial, capturas, Referer).
  useEffect(() => {
    if (read.current) return;
    read.current = true;
    const value = params.get('token');
    setToken(value);
    if (value) window.history.replaceState(null, '', '/reset-password');
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(t('register.err_match'));
      return;
    }
    const policyError = passwordPolicyError(password);
    if (policyError) {
      setError(t(policyError));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/password/reset', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      if (res.ok) {
        router.push('/login?reset=1');
        return;
      }
      // 400 con fields[password] = la contraseña no pasó la política (el token sigue sirviendo).
      // Otro 400 = token inválido, mal copiado, vencido o ya usado. Otro error (429, 5xx): reintentar.
      const data = res.status === 400 ? await res.json().catch(() => ({})) : {};
      if (res.status === 400 && failedPassword(data)) setError(t('register.err_policy'));
      else if (res.status === 400) setToken(null);
      else setError(t('forgot.error'));
    } catch {
      setError(t('forgot.error'));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reset.title')}</h1>
        </div>

        {token === null ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {t('reset.invalid')}
            </p>
            <Link href="/forgot-password" className="btn-primary w-full">
              {t('reset.request_new')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('reset.password')}
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="new-password"
                  maxLength={128}
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('register.confirm')}
              </label>
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="new-password"
                maxLength={128}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !token} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? t('reset.submitting') : t('reset.submit')}
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            {t('forgot.back')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
