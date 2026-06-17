'use client';

import { useEffect, useState } from 'react';
import Link                    from 'next/link';
import {
  AlertCircle, ChevronRight, Loader2,
  Plus, TicketCheck,
} from 'lucide-react';
import clsx from 'clsx';

interface Ticket {
  id:         string;
  category:   string;
  subject:    string;
  status:     string;
  priority:   string;
  created_at: string;
  updated_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  open:         'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400',
  in_progress:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  waiting_user: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  resolved:     'bg-green-100 text-green-700  dark:bg-green-900/30  dark:text-green-400',
  closed:       'bg-gray-100  text-gray-500   dark:bg-slate-700     dark:text-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto', in_progress: 'En proceso', waiting_user: 'Esperando respuesta',
  resolved: 'Resuelto', closed: 'Cerrado',
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    'text-gray-400',
  medium: 'text-yellow-500',
  high:   'text-orange-500',
  urgent: 'text-red-500 font-semibold',
};

const CATEGORIES = ['technical', 'payment', 'academic', 'certificate', 'administrative'] as const;
const CAT_LABEL:  Record<string, string> = {
  technical: 'Técnico', payment: 'Pagos', academic: 'Académico',
  certificate: 'Certificado', administrative: 'Administrativo',
};

// ── Create ticket modal ───────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm]     = useState({ category: 'technical', subject: '', description: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Error'); }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear ticket');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="card w-full max-w-lg space-y-4 p-6"
      >
        <h2 className="text-lg font-semibold">Nuevo ticket de soporte</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="input"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Prioridad</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="input"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Asunto</label>
          <input
            required
            minLength={5}
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Describe brevemente el problema…"
            className="input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Descripción detallada</label>
          <textarea
            required
            minLength={10}
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Explica el problema con todos los detalles posibles…"
            className="input resize-none"
          />
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost border border-[var(--border)]">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? 'Enviando…' : 'Crear ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [total,   setTotal]     = useState(0);
  const [page,    setPage]      = useState(1);
  const [loading, setLoading]   = useState(true);
  const [modal,   setModal]     = useState(false);
  const totalPages = Math.ceil(total / 10);

  async function load(p = page) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets?page=${p}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  function handleCreated() {
    setModal(false);
    load(1);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {modal && <CreateModal onClose={() => setModal(false)} onCreated={handleCreated} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Soporte</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{total} tickets en total</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Nuevo ticket
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-[var(--muted)]">
          <TicketCheck className="h-10 w-10 opacity-30" />
          <p className="font-medium">No tienes tickets de soporte</p>
          <p className="text-sm">Crea uno si tienes algún problema</p>
          <button onClick={() => setModal(true)} className="btn-primary mt-2">
            <Plus className="h-4 w-4" /> Crear ticket
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-[var(--border)] overflow-hidden">
          {tickets.map(t => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[t.status])}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{CAT_LABEL[t.category] ?? t.category}</span>
                  <span className={clsx('text-xs', PRIORITY_STYLE[t.priority])}>● {t.priority}</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium">{t.subject}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Actualizado {new Date(t.updated_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="btn-ghost border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40">
            Anterior
          </button>
          <span className="flex items-center px-3 text-sm text-[var(--muted)]">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="btn-ghost border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
