'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight,
  Clock, GraduationCap, Lock, PlayCircle,
} from 'lucide-react';
import clsx from 'clsx';
import type { CourseDetailResponse } from '@/lib/api';

const CONTENT_ICON: Record<string, React.ElementType> = {
  video:    PlayCircle,
  document: BookOpen,
  quiz:     GraduationCap,
};

export default function CourseDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [course,    setCourse]   = useState<CourseDetailResponse['course'] | null>(null);
  const [loading,   setLoading]  = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled,  setEnrolled]  = useState(false);
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then(r => r.json())
      .then(d => setCourse(d.course))
      .catch(() => setMsg('No se pudo cargar el curso.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleEnroll() {
    setEnrolling(true);
    setMsg('');
    try {
      const res = await fetch('/api/enrollments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: id }) });
      if (res.ok) { setEnrolled(true); setMsg('¡Matriculado correctamente!'); }
      else {
        const err = await res.json();
        setMsg(err.message ?? 'No se pudo matricular.');
      }
    } catch {
      setMsg('Error de red.');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
      <div className="h-48 rounded-xl bg-gray-200 dark:bg-slate-700" />
    </div>
  );

  if (!course) return <p className="text-[var(--muted)]">{msg || 'Curso no encontrado.'}</p>;

  const totalItems = course.modules.reduce((s, m) => s + m.content_items.length, 0);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="btn-ghost -ml-1 gap-1.5 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </button>

      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900">
          <GraduationCap className="h-20 w-20 text-white/30" />
        </div>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-[var(--muted)]">{course.description}</p>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{totalItems} contenidos</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.modules.length} módulos</span>
            </div>
          </div>
          <div className="shrink-0">
            {msg && <p className={clsx('mb-2 text-sm', enrolled ? 'text-green-600' : 'text-red-500')}>{msg}</p>}
            <button
              onClick={handleEnroll}
              disabled={enrolling || enrolled}
              className="btn-primary min-w-[140px]"
            >
              {enrolled ? <><CheckCircle2 className="h-4 w-4" /> Matriculado</> : enrolling ? 'Matriculando…' : 'Matricularme'}
            </button>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Contenido del curso</h2>
        {course.modules.map((mod, mi) => (
          <details key={mod.id} open={mi === 0} className="card">
            <summary className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/40">
                  {mi + 1}
                </span>
                <span className="font-medium">{mod.title}</span>
                <span className="text-xs text-[var(--muted)]">{mod.content_items.length} items</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted)] transition-transform details-open:rotate-90" />
            </summary>
            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {mod.content_items.map(item => {
                const Icon = CONTENT_ICON[item.content_type] ?? BookOpen;
                return (
                  <li key={item.id} className="text-sm">
                    {enrolled && item.content_type === 'quiz' ? (
                      <Link
                        href={`/courses/${id}/quiz/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors group"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                        <span className="flex-1 group-hover:text-brand-600">{item.title}</span>
                        {item.duration_minutes && (
                          <span className="text-xs text-[var(--muted)]">{item.duration_minutes} min</span>
                        )}
                        <span className="text-xs font-medium text-brand-600">Iniciar →</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                        <span className="flex-1">{item.title}</span>
                        {item.duration_minutes && (
                          <span className="text-xs text-[var(--muted)]">{item.duration_minutes} min</span>
                        )}
                        {!enrolled && <Lock className="h-3.5 w-3.5 text-gray-300" />}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
