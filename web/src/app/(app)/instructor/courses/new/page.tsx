'use client';

import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import Link          from 'next/link';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

function toSlug(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewCoursePage() {
  const router = useRouter();
  const [title,       setTitle]       = useState('');
  const [slug,        setSlug]        = useState('');
  const [description, setDescription] = useState('');
  const [level,       setLevel]       = useState('beginner');
  const [language,    setLanguage]    = useState('es');
  const [tags,        setTagsRaw]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  function handleTitleChange(v: string) {
    setTitle(v);
    setSlug(toSlug(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);

    const res = await fetch('/api/courses', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, slug, description: description || undefined, level, language, tags: tagsArr }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Error al crear el curso.');
      return;
    }

    const { course } = await res.json();
    router.push(`/instructor/courses/${course.id}/edit?tab=curriculum`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/instructor" className="btn-ghost rounded-lg p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Nuevo curso</h1>
          <p className="text-sm text-[var(--muted)]">Completa los datos básicos para crear el curso</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
          <BookOpen className="h-7 w-7 text-white" />
        </div>

        {/* Título */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Ej. Fundamentos de Python"
            className="input"
            autoFocus
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
            Slug (URL) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="fundamentos-python"
            pattern="[a-z0-9-]+"
            className="input font-mono text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">Solo letras minúsculas, números y guiones.</p>
        </div>

        {/* Descripción */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Descripción</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe de qué trata el curso…"
            className="input resize-none"
          />
        </div>

        {/* Nivel + Idioma */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Nivel</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="input">
              <option value="beginner">Básico</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Idioma</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="input">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Etiquetas</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTagsRaw(e.target.value)}
            placeholder="python, programación, backend"
            className="input"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">Separadas por comas.</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/instructor" className="btn-ghost flex-1 border border-[var(--border)] text-center">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary flex flex-1 items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creando…' : 'Crear curso'}
          </button>
        </div>
      </form>
    </div>
  );
}
