'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Moon, Sun, TicketCheck, User } from 'lucide-react';
import clsx from 'clsx';
import NotificationBell from './NotificationBell';
import { useTheme, useLang } from '@/contexts/app-context';

export default function Navbar() {
  const { data: session } = useSession();
  const path = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { t, toggle: toggleLang, lang } = useLang();

  const NAV = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/courses',   label: t('nav.courses'),   icon: GraduationCap   },
    { href: '/tickets',   label: t('nav.support'),   icon: TicketCheck     },
    { href: '/profile',   label: t('nav.profile'),   icon: User            },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-brand-600">
          <BookOpen className="h-6 w-6" />
          <span className="hidden sm:inline">Universidad X</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden gap-1 sm:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                path.startsWith(href)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'text-[var(--muted)] hover:bg-brand-50 dark:hover:bg-brand-900/20',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <NotificationBell />

          {/* Toggle idioma */}
          <button
            onClick={toggleLang}
            title={t('nav.lang')}
            className="btn-ghost px-2.5 py-2 text-xs font-semibold tracking-wider"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          {/* Toggle tema */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t('nav.theme.light') : t('nav.theme.dark')}
            className="btn-ghost px-2.5 py-2"
          >
            {theme === 'dark'
              ? <Sun  className="h-4 w-4" />
              : <Moon className="h-4 w-4" />
            }
          </button>

          <span className="hidden text-sm text-[var(--muted)] sm:block ml-1">
            {session?.user?.name ?? session?.user?.email}
          </span>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-ghost gap-1.5 px-3 py-2 text-sm"
            title={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
