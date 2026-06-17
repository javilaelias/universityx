'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Search, Users } from 'lucide-react';
import clsx from 'clsx';
import type { CourseCard } from '@/lib/api';

const LEVELS = ['', 'beginner', 'intermediate', 'advanced'];
const LEVEL_LABELS: Record<string, string> = {
  '': 'Todos', beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado',
};
const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
};

export default function CoursesPage() {
  const [courses, setCourses]   = useState<CourseCard[]>([]);
  const [total,   setTotal]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [level,   setLevel]     = useState('');
  const [page,    setPage]      = useState(1);
  const totalPages              = Math.ceil(total / 12);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set('search', search);
    if (level)  qs.set('level', level);

    fetch(`/api/courses?${qs}`)
      .then(r => r.json())
      .then(d => { setCourses(d.courses ?? []); setTotal(d.total ?? 0); })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [search, level, page]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Catálogo de Cursos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{total} cursos disponibles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar cursos…"
            className="input pl-9"
          />
        </form>

        <div className="flex gap-2">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => { setLevel(l); setPage(1); }}
              className={clsx(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                level === l
                  ? 'bg-brand-600 text-white'
                  : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-gray-50',
              )}
            >
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-5 space-y-3">
              <div className="h-36 rounded-lg bg-gray-200 dark:bg-slate-700" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-[var(--muted)]">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="font-medium">No se encontraron cursos</p>
          <p className="text-sm">Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-slate-700 dark:to-slate-600">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <GraduationCap className="h-12 w-12 text-brand-400" />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                {/* Level badge */}
                <span className={clsx('w-fit rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_COLORS[course.level] ?? 'bg-gray-100 text-gray-600')}>
                  {LEVEL_LABELS[course.level] ?? course.level}
                </span>

                <h3 className="font-semibold leading-snug group-hover:text-brand-600 transition-colors">
                  {course.title}
                </h3>
                <p className="line-clamp-2 text-sm text-[var(--muted)]">{course.description}</p>

                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-[var(--muted)]">
                  <span>{course.instructor_name}</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.enrolled_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-ghost border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="flex items-center px-3 text-sm text-[var(--muted)]">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn-ghost border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
