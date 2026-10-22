'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/app-context';
import BrandLogo from '@/components/BrandLogo';
import { brandFooter, useBrand } from '@/contexts/brand-context';
import { passwordPolicyError, failedPassword } from '@/lib/password-policy';

export default function RegisterPage() {
  const router = useRouter();
  const { t }  = useLang();
  const brand  = useBrand();

  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [show,      setShow]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(t('register.err_match'));
      return;
    }
    const policyError = passwordPolicyError(password, email);
    if (policyError) {
      setError(t(policyError));
      return;
    }

    setLoading(true);

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      // 400 con fields[password] = política de contraseña; 409 = email ya registrado.
      setError(t(res.status === 409 ? 'register.err_taken'
        : res.status === 400 && failedPassword(data) ? 'register.err_policy'
        : 'register.err_default'));
      return;
    }

    // Auto-login tras registro exitoso
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // Registro OK pero login falló — redirigir al login
      router.push('/login?registered=1');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-900 to-slate-800 px-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <BrandLogo className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register.title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{brand.name} · {t('register.subtitle')}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('register.fullname')}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={t('register.name_ph')}
              className="input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('register.email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('login.email_ph')}
              className="input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('register.password')}
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="new-password"
                maxLength={128}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('register.password_ph')}
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
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={t('register.confirm_ph')}
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
            {loading ? t('register.submitting') : t('register.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {t('register.has_account')}{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            {t('register.signin')}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400">
          {brandFooter(brand)}
        </p>
      </div>
    </div>
  );
}
