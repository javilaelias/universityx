'use client';

import { useSession } from 'next-auth/react';
import { useRouter }  from 'next/navigation';
import { useEffect, useState } from 'react';
import Link  from 'next/link';
import {
  BookOpen, Plus, Edit2, Trash2, Eye, EyeOff,
  Users, Layers, Loader2,
} from 'lucide-react';
import clsx from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────

type CourseCard = {
  id:            string;
  title:         string;
  thumbnail_url: string | null;
  level:         string;
  is_published:  boolean;
  module_count:  number;
  enrolled_count:number;
};

const LEVEL_BADGE: Record<string, string> = {
  beginner:     'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced:     'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function InstructorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses,    setCourses]    = useState<CourseCard[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (session?.user?.role !== 'instructor' && session?.user?.role !== 'admin') {
      router.replace('/dashboard'); return;
    }
    load();
  }, [status]);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/instructor/courses');
    if (res.ok) {
      const { courses } = await res.json();
      setCourses(courses ?? []);
    }
    setLoading(false);
  }

  async function togglePublish(course: CourseCard) {
    setTogglingId(course.id);
    const res = await fetch(`/api/courses/${course.id}/publish`, { method: 'POST' });
    if (res.ok) {
      const { course: updated } = await res.json();
      setCourses(cs => cs.map(c => c.id === course.id ? { ...c, is_published: updated.is_published } : c));
    }
    setTogglingId(null);
  }

  async function deleteCourse(course: CourseCard) {
    if (!confirm(`¿Eliminar "${course.title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(course.id);
    const res = await fetch(`/api/courses/${course.id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) setCourses(cs => cs.filter(c => c.id !== course.id));
    setDeletingId(null);
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Mis cursos</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {courses.length === 0 ? 'Todavía no tienes cursos' : `${courses.length} curso${courses.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/instructor/courses/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo curso
        </Link>
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] py-20 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-[var(--muted)]" />
          <p className="text-lg font-medium text-[var(--text)]">Crea tu primer curso</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
            Comparte tu conocimiento con estudiantes de todo el mundo.
          </p>
          <Link href="/instructor/courses/new" className="btn-primary mt-6 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo curso
          </Link>
        </div>
      )}

      {/* Course grid */}
      {courses.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-500">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-10 w-10 text-white/80" />
                )}
              </div>

              {/* Body */}
              <div className="space-y-3 p-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_BADGE[course.level] ?? LEVEL_BADGE.beginner)}>
                    {LEVEL_LABEL[course.level] ?? course.level}
                  </span>
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', course.is_published
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                  )}>
                    {course.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                <h3 className="line-clamp-2 font-semibold leading-snug text-[var(--text)]">{course.title}</h3>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Users  className="h-3.5 w-3.5" />{course.enrolled_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />{course.module_count} módulos
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="btn-ghost flex flex-1 items-center justify-center gap-1.5 border border-[var(--border)] text-sm"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </Link>

                  <button
                    onClick={() => togglePublish(course)}
                    disabled={togglingId === course.id}
                    title={course.is_published ? 'Retirar' : 'Publicar'}
                    className="btn-ghost border border-[var(--border)] p-2"
                  >
                    {togglingId === course.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : course.is_published
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye    className="h-4 w-4 text-brand-600" />
                    }
                  </button>

                  <button
                    onClick={() => deleteCourse(course)}
                    disabled={deletingId === course.id}
                    title="Eliminar"
                    className="btn-ghost border border-[var(--border)] p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deletingId === course.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2  className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
