'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import clsx from 'clsx';

interface Notification {
  id:         string;
  type:       string;
  title:      string;
  body:       string | null;
  is_read:    boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [count,  setCount]  = useState(0);
  const [open,   setOpen]   = useState(false);
  const [items,  setItems]  = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 60 s
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function fetchCount() {
    try {
      const res = await fetch('/api/notifications/count');
      const { count } = await res.json();
      setCount(Number(count) || 0);
    } catch { /* silent */ }
  }

  async function handleOpen() {
    if (!open) {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications?limit=10');
        const data = await res.json();
        setItems(data.notifications ?? []);
      } finally {
        setLoading(false);
      }
    }
    setOpen(o => !o);
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PUT' });
    setCount(0);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="text-sm font-semibold">Notificaciones</span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <Check className="h-3 w-3" /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted)]">Sin notificaciones</p>
            ) : (
              items.map(n => (
                <div
                  key={n.id}
                  className={clsx(
                    'border-b border-[var(--border)] px-4 py-3 last:border-0',
                    !n.is_read && 'bg-brand-50 dark:bg-brand-900/10',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <div className={clsx(!n.is_read ? '' : 'ml-4')}>
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-[var(--muted)]">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        {new Date(n.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
