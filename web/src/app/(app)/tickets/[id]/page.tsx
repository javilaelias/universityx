'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter }         from 'next/navigation';
import { useSession }                   from 'next-auth/react';
import { ArrowLeft, Loader2, Send, User } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id:          string;
  author_id:   string;
  author_name: string;
  author_role: string;
  body:        string;
  is_internal: boolean;
  created_at:  string;
}

interface Ticket {
  id:          string;
  subject:     string;
  description: string;
  status:      string;
  priority:    string;
  category:    string;
  created_at:  string;
}

const STATUS_STYLE: Record<string, string> = {
  open:         'bg-blue-100 text-blue-700',
  in_progress:  'bg-yellow-100 text-yellow-700',
  waiting_user: 'bg-purple-100 text-purple-700',
  resolved:     'bg-green-100 text-green-700',
  closed:       'bg-gray-100 text-gray-500',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto', in_progress: 'En proceso', waiting_user: 'Esperando respuesta',
  resolved: 'Resuelto', closed: 'Cerrado',
};

export default function TicketDetailPage() {
  const { id }            = useParams<{ id: string }>();
  const router            = useRouter();
  const { data: session } = useSession();
  const [ticket,   setTicket]   = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [reply,    setReply]    = useState('');
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then(r => r.json())
      .then(d => { setTicket(d.ticket); setMessages(d.messages ?? []); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body: reply.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            ...data.message,
            author_name: session?.user?.name ?? 'Tú',
            author_role: session?.user?.role ?? 'student',
          },
        ]);
        setReply('');
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );

  if (!ticket) return (
    <div className="py-20 text-center text-[var(--muted)]">Ticket no encontrado.</div>
  );

  const isClosed = ['resolved', 'closed'].includes(ticket.status);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => router.back()} className="btn-ghost -ml-1 gap-1.5 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver a soporte
      </button>

      {/* Ticket header */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-lg font-bold leading-snug">{ticket.subject}</h1>
          <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLE[ticket.status])}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{ticket.description}</p>
        <p className="text-xs text-[var(--muted)]">
          Creado el {new Date(ticket.created_at).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Messages thread */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted)] py-6">
            Aún no hay respuestas. Nuestro equipo te responderá pronto.
          </p>
        ) : (
          messages.map(msg => {
            const isMe = msg.author_id === session?.user?.id;
            const isSupport = ['admin', 'support'].includes(msg.author_role);
            return (
              <div key={msg.id} className={clsx('flex gap-3', isMe ? 'flex-row-reverse' : '')}>
                {/* Avatar */}
                <div className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold',
                  isSupport ? 'bg-brand-600' : 'bg-slate-400',
                )}>
                  {isSupport ? 'UX' : <User className="h-4 w-4" />}
                </div>
                {/* Bubble */}
                <div className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                  isMe
                    ? 'rounded-tr-sm bg-brand-600 text-white'
                    : 'rounded-tl-sm bg-[var(--surface)] border border-[var(--border)]',
                )}>
                  {!isMe && (
                    <p className={clsx('mb-1 text-xs font-semibold', isSupport ? 'text-brand-600' : 'text-[var(--muted)]')}>
                      {isSupport ? 'Soporte Universidad X' : msg.author_name}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  <p className={clsx('mt-1 text-[10px]', isMe ? 'text-brand-200' : 'text-[var(--muted)]')}>
                    {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {isClosed ? (
        <p className="rounded-lg bg-gray-50 py-3 text-center text-sm text-[var(--muted)] dark:bg-slate-800">
          Este ticket está {STATUS_LABEL[ticket.status].toLowerCase()} — no se pueden agregar más mensajes.
        </p>
      ) : (
        <form onSubmit={sendReply} className="card flex items-end gap-3 p-3">
          <textarea
            rows={2}
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Escribe tu respuesta…"
            className="input flex-1 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); } }}
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="btn-primary h-10 w-10 shrink-0 p-0 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  );
}
