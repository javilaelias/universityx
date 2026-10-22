'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useLang } from '@/contexts/app-context';

export default function ForgotPasswordPage() {
  const { t, lang } = useLang();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/password/forgot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, locale: lang }),
      });
      // 202 = respuesta genérica (no revela si el email existe); 400 = email mal escrito
      if (res.ok) setSent(true);
      else setError(t('forgot.error'));
    } catch {
      setError(t('forgot.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <BrandLogo className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('forgot.title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('forgot.subtitle')}</p>
          </div>
        </div>

        {sent ? (
          <p className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
            {t('forgot.sent')}
          </p>
        ) : (
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
                placeholder={t('login.email_ph')}
                className="input"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? t('forgot.submitting') : t('forgot.submit')}
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
