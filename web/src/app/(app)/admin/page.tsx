'use client';

import { useSession } from 'next-auth/react';
import { useRouter }  from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2, Plus, Search, Shield, TicketCheck, Users } from 'lucide-react';
import clsx from 'clsx';
import { useLang } from '@/contexts/app-context';
import type { TranslationKey } from '@/lib/i18n';

// ── Tipos ─────────────────────────────────────────────────────────────────────

const ROLES    = ['student', 'instructor', 'support', 'admin'] as const;
const STATUSES = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'] as const;

type AdminUser = {
  id: string; email: string; full_name: string; role: string;
  is_active: boolean; last_login_at: string | null;
};
type AdminCourse = {
  id: string; title: string; level: string; is_published: boolean;
  instructor_name: string | null; module_count: number; enrolled_count: number;
};
type AdminTicket = {
  id: string; subject: string; status: string; priority: string;
  user_name: string; user_email: string; updated_at: string;
};
type Page<T> = { items: T[]; page: number; totalPages: number };

type T = (key: TranslationKey) => string;

const TABS = [
  { key: 'users',   label: 'admin.tab.users',   icon: Users       },
  { key: 'courses', label: 'admin.tab.courses', icon: BookOpen    },
  { key: 'tickets', label: 'admin.tab.tickets', icon: TicketCheck },
] as const;
type Tab = typeof TABS[number]['key'];

// Mensaje de error del servicio → texto traducido.
async function errorText(res: Response, t: T): Promise<string> {
  const data = await res.json().catch(() => ({}));
  if (res.status === 409 && String(data.error ?? '').includes('administrador')) return t('admin.err_last_admin');
  if (res.status === 409) return t('admin.err_taken');
  if (res.status === 400 && Array.isArray(data.fields) && data.fields.some((f: { field: string }) => f.field === 'password')) {
    return t('admin.err_policy');
  }
  return t('admin.err_generic');
}

function formatDate(value: string | null, lang: string, t: T) {
  if (!value) return t('admin.never');
  return new Date(value).toLocaleDateString(lang === 'en' ? 'en-US' : 'es', { dateStyle: 'medium' });
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('users');

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (!isAdmin) router.replace('/dashboard');
  }, [status, isAdmin, router]);

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-brand-600" />
        <h1 className="text-2xl font-bold text-[var(--text)]">{t('admin.title')}</h1>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]" role="tablist">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx(
              '-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === key
                ? 'border-brand-600 text-brand-700 dark:text-brand-400'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]',
            )}
          >
            <Icon className="h-4 w-4" />
            {t(label)}
          </button>
        ))}
      </div>

      {tab === 'users'   && <UsersTab   t={t} selfId={session!.user.id} />}
      {tab === 'courses' && <CoursesTab t={t} />}
      {tab === 'tickets' && <TicketsTab t={t} />}
    </div>
  );
}

// ── Piezas comunes ────────────────────────────────────────────────────────────

function Pager({ page, totalPages, onPage, t }: { page: number; totalPages: number; onPage: (p: number) => void; t: T }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-[var(--muted)]">
      <button className="btn-ghost px-3 py-1.5" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t('admin.prev')}</button>
      <span>{t('admin.page')} {page} / {totalPages}</span>
      <button className="btn-ghost px-3 py-1.5" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>{t('admin.next')}</button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{message}</p>;
}

function Table({ head, children, empty, t }: { head: string[]; children: React.ReactNode; empty: boolean; t: T }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            {head.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{t('admin.empty')}</p>}
    </div>
  );
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

function UsersTab({ t, selfId }: { t: T; selfId: string }) {
  const { lang } = useLang();
  const [data,    setData]    = useState<Page<AdminUser>>({ items: [], page: 1, totalPages: 1 });
  const [search,  setSearch]  = useState('');   // lo que se escribe
  const [query,   setQuery]   = useState('');   // lo que se busca (al enviar)
  const [role,    setRole]    = useState('');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState<string | null>(null);
  const [error,   setError]   = useState('');
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (query) qs.set('search', query);
    if (role) qs.set('role', role);
    try {
      const res = await fetch(`/api/admin/users?${qs}`);
      if (res.ok) {
        const d = await res.json();
        setData({ items: d.users ?? [], page: d.page ?? 1, totalPages: d.totalPages || 1 });
        setError('');
      } else {
        setError(await errorText(res, t));
      }
    } catch {
      setError(t('admin.err_generic'));
    } finally {
      setLoading(false);
    }
  }, [page, query, role, t]);

  useEffect(() => { load(); }, [load]);

  async function update(user: AdminUser, body: { role?: string; isActive?: boolean }) {
    setBusyId(user.id);
    setError('');
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (res.ok) {
      const { user: updated } = await res.json();
      setData(d => ({ ...d, items: d.items.map(u => u.id === user.id ? { ...u, ...updated } : u) }));
    } else {
      setError(await errorText(res, t));
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative flex-1 min-w-[200px]"
          onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="input pl-9"
            placeholder={t('admin.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
        <select className="input w-auto" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">{t('admin.all_roles')}</option>
          {ROLES.map(r => <option key={r} value={r}>{t(`admin.role.${r}`)}</option>)}
        </select>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowNew(v => !v)}>
          <Plus className="h-4 w-4" />
          {t('admin.new_user')}
        </button>
      </div>

      {showNew && <NewUserForm t={t} onCancel={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}
      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
      ) : (
        <Table
          t={t}
          empty={data.items.length === 0}
          head={[t('admin.col.name'), t('admin.col.email'), t('admin.col.role'), t('admin.col.status'), t('admin.col.last_login'), '']}
        >
          {data.items.map(u => {
            const self = u.id === selfId;
            return (
              <tr key={u.id} className="text-[var(--text)]">
                <td className="px-4 py-3 font-medium">{u.full_name} {self && <span className="text-[var(--muted)]">{t('admin.you')}</span>}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="input w-auto py-1"
                    value={u.role}
                    disabled={self || busyId === u.id}
                    onChange={e => update(u, { role: e.target.value })}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{t(`admin.role.${r}`)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', u.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>
                    {u.is_active ? t('admin.active') : t('admin.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{formatDate(u.last_login_at, lang, t)}</td>
                <td className="px-4 py-3 text-right">
                  {!self && (
                    <button
                      className="btn-ghost px-3 py-1.5 text-xs"
                      disabled={busyId === u.id}
                      onClick={() => update(u, { isActive: !u.is_active })}
                    >
                      {u.is_active ? t('admin.deactivate') : t('admin.activate')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <Pager t={t} page={data.page} totalPages={data.totalPages} onPage={setPage} />
    </div>
  );
}

function NewUserForm({ t, onCancel, onCreated }: { t: T; onCancel: () => void; onCreated: () => void }) {
  const [form,   setForm]   = useState({ fullName: '', email: '', role: 'instructor', password: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) onCreated();
    else setError(await errorText(res, t));
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4 sm:grid-cols-2">
      <input className="input" required minLength={2} placeholder={t('admin.col.name')}
        value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
      <input className="input" required type="email" placeholder={t('admin.col.email')}
        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
        {ROLES.map(r => <option key={r} value={r}>{t(`admin.role.${r}`)}</option>)}
      </select>
      <input className="input" required type="password" minLength={10} autoComplete="new-password"
        placeholder={t('admin.initial_password')}
        value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
      <div className="sm:col-span-2"><ErrorBanner message={error} /></div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" className="btn-ghost px-4 py-2" onClick={onCancel}>{t('admin.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('admin.creating') : t('admin.create')}
        </button>
      </div>
    </form>
  );
}

// ── Cursos ────────────────────────────────────────────────────────────────────

function CoursesTab({ t }: { t: T }) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState<string | null>(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/courses');
        if (res.ok) { setCourses((await res.json()).courses ?? []); setError(''); }
        else setError(await errorText(res, t));
      } catch {
        setError(t('admin.err_generic'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  async function togglePublish(course: AdminCourse) {
    setBusyId(course.id);
    setError('');
    const res = await fetch(`/api/courses/${course.id}/publish`, { method: 'POST' });
    if (res.ok) {
      const { course: updated } = await res.json();
      setCourses(cs => cs.map(c => c.id === course.id ? { ...c, is_published: updated.is_published } : c));
    } else {
      setError(await errorText(res, t));
    }
    setBusyId(null);
  }

  if (loading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />
      <Table
        t={t}
        empty={courses.length === 0}
        head={[t('admin.col.course'), t('admin.col.instructor'), t('admin.col.enrolled'), t('admin.col.status'), '']}
      >
        {courses.map(c => (
          <tr key={c.id} className="text-[var(--text)]">
            <td className="px-4 py-3 font-medium">
              <Link href={`/courses/${c.id}`} className="hover:text-brand-600">{c.title}</Link>
            </td>
            <td className="px-4 py-3 text-[var(--muted)]">{c.instructor_name ?? '—'}</td>
            <td className="px-4 py-3 text-[var(--muted)]">{c.enrolled_count}</td>
            <td className="px-4 py-3">
              <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', c.is_published
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400')}>
                {c.is_published ? t('admin.published') : t('admin.draft')}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busyId === c.id} onClick={() => togglePublish(c)}>
                {c.is_published ? t('admin.unpublish') : t('admin.publish')}
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ── Tickets ───────────────────────────────────────────────────────────────────

function TicketsTab({ t }: { t: T }) {
  const { lang } = useLang();
  const [data,    setData]    = useState<Page<AdminTicket>>({ items: [], page: 1, totalPages: 1 });
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState<string | null>(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams({ page: String(page) });
      if (status) qs.set('status', status);
      try {
        const res = await fetch(`/api/admin/tickets?${qs}`);
        if (res.ok) {
          const d = await res.json();
          setData({ items: d.tickets ?? [], page: d.page ?? 1, totalPages: d.totalPages || 1 });
          setError('');
        } else {
          setError(await errorText(res, t));
        }
      } catch {
        setError(t('admin.err_generic'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, status, t]);

  async function changeStatus(ticket: AdminTicket, next: string) {
    setBusyId(ticket.id);
    setError('');
    const res = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: next }),
    });
    if (res.ok) {
      const { ticket: updated } = await res.json();
      setData(d => ({ ...d, items: d.items.map(x => x.id === ticket.id ? { ...x, status: updated.status, updated_at: updated.updated_at } : x) }));
    } else {
      setError(await errorText(res, t));
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-4">
      <select className="input w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
        <option value="">{t('admin.all_status')}</option>
        {STATUSES.map(s => <option key={s} value={s}>{t(`admin.status.${s}`)}</option>)}
      </select>
      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
      ) : (
        <Table
          t={t}
          empty={data.items.length === 0}
          head={[t('admin.col.subject'), t('admin.col.user'), t('admin.col.status'), t('admin.col.updated'), '']}
        >
          {data.items.map(tk => (
            <tr key={tk.id} className="text-[var(--text)]">
              <td className="px-4 py-3 font-medium">{tk.subject}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{tk.user_name} <span className="text-xs">({tk.user_email})</span></td>
              <td className="px-4 py-3">
                <select
                  className="input w-auto py-1"
                  value={tk.status}
                  disabled={busyId === tk.id}
                  onChange={e => changeStatus(tk, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{t(`admin.status.${s}`)}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">{formatDate(tk.updated_at, lang, t)}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/tickets/${tk.id}`} className="btn-ghost px-3 py-1.5 text-xs">{t('admin.open_ticket')}</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Pager t={t} page={data.page} totalPages={data.totalPages} onPage={setPage} />
    </div>
  );
}
