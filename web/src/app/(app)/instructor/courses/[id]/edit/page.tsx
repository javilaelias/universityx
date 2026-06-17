'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Eye, EyeOff, Loader2, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronRight, Video, FileText, HelpCircle, ClipboardList,
  Radio, Save,
} from 'lucide-react';
import clsx from 'clsx';
import { Suspense } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentItemData = {
  id:               string;
  module_id:        string;
  type:             'video' | 'document' | 'quiz' | 'assignment' | 'live_session';
  title:            string;
  description:      string | null;
  content_url:      string | null;
  duration_seconds: number | null;
  position:         number;
  is_free_preview:  boolean;
};

type ModuleData = {
  id:              string;
  course_id:       string;
  title:           string;
  description:     string | null;
  position:        number;
  release_date:    string | null;
  is_downloadable: boolean;
  content_items:   ContentItemData[];
};

type CourseData = {
  id:            string;
  title:         string;
  slug:          string;
  description:   string | null;
  thumbnail_url: string | null;
  level:         string;
  language:      string;
  tags:          string[];
  is_published:  boolean;
  modules:       ModuleData[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  video:        Video,
  document:     FileText,
  quiz:         HelpCircle,
  assignment:   ClipboardList,
  live_session: Radio,
};

const CONTENT_LABELS: Record<string, string> = {
  video: 'Video', document: 'Documento', quiz: 'Quiz',
  assignment: 'Tarea', live_session: 'Clase en vivo',
};

// ── ContentRow ────────────────────────────────────────────────────────────────

function ContentRow({
  item, moduleId,
  onUpdate, onDelete,
}: {
  item: ContentItemData;
  moduleId: string;
  onUpdate: (contentId: string, data: Partial<ContentItemData>) => Promise<void>;
  onDelete: (contentId: string) => Promise<void>;
}) {
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title:            item.title,
    type:             item.type as string,
    content_url:      item.content_url ?? '',
    duration_seconds: item.duration_seconds?.toString() ?? '',
    is_free_preview:  item.is_free_preview,
    position:         item.position.toString(),
  });

  async function handleSave() {
    setSaving(true);
    await onUpdate(item.id, {
      title:            form.title,
      type:             form.type as ContentItemData['type'],
      content_url:      form.content_url || null,
      duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null,
      is_free_preview:  form.is_free_preview,
      position:         parseInt(form.position),
    });
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  }

  const Icon = CONTENT_ICONS[item.type] ?? FileText;

  if (editing) {
    return (
      <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/30 p-3 dark:border-brand-900/50 dark:bg-brand-900/10">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-[var(--muted)]">Título</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="input text-sm" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="input text-sm">
              <option value="video">Video</option>
              <option value="document">Documento</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Tarea</option>
              <option value="live_session">Clase en vivo</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Posición</label>
            <input type="number" min="1" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} className="input text-sm" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-[var(--muted)]">URL del contenido</label>
            <input value={form.content_url} onChange={e => setForm(f => ({...f, content_url: e.target.value}))} className="input text-sm" placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Duración (segundos)</label>
            <input type="number" min="0" value={form.duration_seconds} onChange={e => setForm(f => ({...f, duration_seconds: e.target.value}))} className="input text-sm" placeholder="0" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" checked={form.is_free_preview} onChange={e => setForm(f => ({...f, is_free_preview: e.target.checked}))} className="h-4 w-4 rounded border-gray-300 text-brand-600" />
              Vista previa gratuita
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="btn-ghost flex flex-1 items-center justify-center gap-1 border border-[var(--border)] text-sm">
            <X className="h-3.5 w-3.5" /> Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-1 text-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg)]">
      <Icon className="h-4 w-4 flex-shrink-0 text-brand-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--text)]">{item.title}</p>
        <p className="text-xs text-[var(--muted)]">
          {CONTENT_LABELS[item.type] ?? item.type}
          {item.duration_seconds ? ` · ${Math.round(item.duration_seconds / 60)} min` : ''}
          {item.is_free_preview ? ' · Vista previa' : ''}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => setEditing(true)} className="btn-ghost p-1"><Edit2 className="h-3.5 w-3.5" /></button>
        <button onClick={handleDelete} disabled={deleting} className="btn-ghost p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── AddContentForm ────────────────────────────────────────────────────────────

function AddContentForm({
  nextPosition, onAdd, onCancel,
}: {
  nextPosition: number;
  onAdd: (data: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: '', type: 'video', content_url: '', duration_seconds: '',
    is_free_preview: false, position: nextPosition.toString(),
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onAdd({
      title:            form.title,
      type:             form.type,
      content_url:      form.content_url || undefined,
      duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : undefined,
      is_free_preview:  form.is_free_preview,
      position:         parseInt(form.position),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/20 p-3 dark:border-brand-800 dark:bg-brand-900/5">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Título del contenido" className="input text-sm" autoFocus />
        </div>
        <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="input text-sm">
          <option value="video">Video</option>
          <option value="document">Documento</option>
          <option value="quiz">Quiz</option>
          <option value="assignment">Tarea</option>
          <option value="live_session">Clase en vivo</option>
        </select>
        <input type="number" min="0" value={form.duration_seconds} onChange={e => setForm(f => ({...f, duration_seconds: e.target.value}))} placeholder="Duración (s)" className="input text-sm" />
        <div className="col-span-2">
          <input value={form.content_url} onChange={e => setForm(f => ({...f, content_url: e.target.value}))} placeholder="URL del contenido (opcional)" className="input text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex flex-1 items-center justify-center gap-1 border border-[var(--border)] text-sm">
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
        <button onClick={handleAdd} disabled={saving || !form.title.trim()} className="btn-primary flex flex-1 items-center justify-center gap-1 text-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Agregar
        </button>
      </div>
    </div>
  );
}

// ── ModuleRow ─────────────────────────────────────────────────────────────────

function ModuleRow({
  module, isExpanded, onToggle,
  onUpdateModule, onDeleteModule, onUpdateContent, onDeleteContent, onAddContent,
}: {
  module:          ModuleData;
  isExpanded:      boolean;
  onToggle:        () => void;
  onUpdateModule:  (id: string, data: Partial<ModuleData>) => Promise<void>;
  onDeleteModule:  (id: string) => Promise<void>;
  onUpdateContent: (moduleId: string, contentId: string, data: Partial<ContentItemData>) => Promise<void>;
  onDeleteContent: (moduleId: string, contentId: string) => Promise<void>;
  onAddContent:    (moduleId: string, data: object) => Promise<void>;
}) {
  const [editing,        setEditing]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [addingContent,  setAddingContent]  = useState(false);
  const [form, setForm] = useState({
    title:           module.title,
    description:     module.description ?? '',
    position:        module.position.toString(),
    is_downloadable: module.is_downloadable,
  });

  async function handleSave() {
    setSaving(true);
    await onUpdateModule(module.id, {
      title:           form.title,
      description:     form.description || null,
      position:        parseInt(form.position),
      is_downloadable: form.is_downloadable,
    });
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el módulo "${module.title}" y todo su contenido?`)) return;
    setDeleting(true);
    await onDeleteModule(module.id);
    setDeleting(false);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {/* Module header — edit mode */}
      {editing ? (
        <div className="space-y-3 border-b border-[var(--border)] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-[var(--muted)]">Título del módulo</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="input" autoFocus />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-[var(--muted)]">Descripción (opcional)</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input resize-none text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Posición</label>
              <input type="number" min="1" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} className="input text-sm" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
                <input type="checkbox" checked={form.is_downloadable} onChange={e => setForm(f => ({...f, is_downloadable: e.target.checked}))} className="h-4 w-4 rounded border-gray-300 text-brand-600" />
                Descargable
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-ghost flex flex-1 items-center justify-center gap-1 border border-[var(--border)] text-sm">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-1 text-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar
            </button>
          </div>
        </div>
      ) : (
        /* Module header — display mode */
        <div className="flex items-center gap-3 p-4">
          <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
            {isExpanded
              ? <ChevronDown  className="h-4 w-4 flex-shrink-0 text-brand-600" />
              : <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--muted)]" />
            }
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--text)]">
                <span className="mr-2 text-sm text-brand-600">M{module.position}</span>
                {module.title}
              </p>
              {!isExpanded && (
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {module.content_items.length} elemento{module.content_items.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </button>
          <div className="flex flex-shrink-0 items-center gap-1">
            <button onClick={() => setEditing(true)} className="btn-ghost p-1.5" title="Editar módulo">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Content list */}
      {isExpanded && (
        <div className="space-y-1 border-t border-[var(--border)] p-3">
          {module.content_items.length === 0 && !addingContent && (
            <p className="py-4 text-center text-sm text-[var(--muted)]">Sin contenido aún</p>
          )}
          {module.content_items.map(item => (
            <ContentRow
              key={item.id}
              item={item}
              moduleId={module.id}
              onUpdate={(contentId, data) => onUpdateContent(module.id, contentId, data)}
              onDelete={(contentId) => onDeleteContent(module.id, contentId)}
            />
          ))}
          {addingContent && (
            <AddContentForm
              nextPosition={module.content_items.length + 1}
              onAdd={async (data) => { await onAddContent(module.id, data); setAddingContent(false); }}
              onCancel={() => setAddingContent(false)}
            />
          )}
          {!addingContent && (
            <button
              onClick={() => setAddingContent(true)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-2 text-sm text-[var(--muted)] transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" /> Agregar contenido
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── CurriculumEditor ──────────────────────────────────────────────────────────

function CurriculumEditor({ courseId, initialModules }: { courseId: string; initialModules: ModuleData[] }) {
  const [modules,        setModules]        = useState<ModuleData[]>(initialModules);
  const [expandedId,     setExpandedId]     = useState<string | null>(initialModules[0]?.id ?? null);
  const [addModuleForm,  setAddModuleForm]  = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule,   setAddingModule]   = useState(false);

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const res = await fetch(`/api/courses/${courseId}/modules`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newModuleTitle, position: modules.length + 1, is_downloadable: true }),
    });
    if (res.ok) {
      const { module } = await res.json();
      setModules(ms => [...ms, { ...module, content_items: [] }]);
      setExpandedId(module.id);
      setNewModuleTitle('');
      setAddModuleForm(false);
    }
    setAddingModule(false);
  }

  async function handleUpdateModule(id: string, data: Partial<ModuleData>) {
    const res = await fetch(`/api/modules/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (res.ok) {
      const { module } = await res.json();
      setModules(ms => ms.map(m => m.id === id ? { ...m, ...module } : m));
    }
  }

  async function handleDeleteModule(id: string) {
    const res = await fetch(`/api/modules/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setModules(ms => ms.filter(m => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  async function handleUpdateContent(moduleId: string, contentId: string, data: Partial<ContentItemData>) {
    const res = await fetch(`/api/modules/${moduleId}/content/${contentId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (res.ok) {
      const { content_item } = await res.json();
      setModules(ms => ms.map(m =>
        m.id === moduleId
          ? { ...m, content_items: m.content_items.map(ci => ci.id === contentId ? { ...ci, ...content_item } : ci) }
          : m
      ));
    }
  }

  async function handleDeleteContent(moduleId: string, contentId: string) {
    const res = await fetch(`/api/modules/${moduleId}/content/${contentId}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setModules(ms => ms.map(m =>
        m.id === moduleId ? { ...m, content_items: m.content_items.filter(ci => ci.id !== contentId) } : m
      ));
    }
  }

  async function handleAddContent(moduleId: string, data: object) {
    const res = await fetch(`/api/modules/${moduleId}/content`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (res.ok) {
      const { content_item } = await res.json();
      setModules(ms => ms.map(m =>
        m.id === moduleId ? { ...m, content_items: [...m.content_items, content_item] } : m
      ));
    }
  }

  const totalItems = modules.reduce((acc, m) => acc + m.content_items.length, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        {modules.length} módulo{modules.length !== 1 ? 's' : ''} · {totalItems} elemento{totalItems !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {[...modules].sort((a, b) => a.position - b.position).map(module => (
          <ModuleRow
            key={module.id}
            module={module}
            isExpanded={expandedId === module.id}
            onToggle={() => setExpandedId(id => id === module.id ? null : module.id)}
            onUpdateModule={handleUpdateModule}
            onDeleteModule={handleDeleteModule}
            onUpdateContent={handleUpdateContent}
            onDeleteContent={handleDeleteContent}
            onAddContent={handleAddContent}
          />
        ))}
      </div>

      {addModuleForm ? (
        <div className="space-y-2 rounded-xl border border-dashed border-brand-400 p-4 dark:border-brand-700">
          <input
            value={newModuleTitle}
            onChange={e => setNewModuleTitle(e.target.value)}
            placeholder="Título del módulo"
            className="input"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddModule()}
          />
          <div className="flex gap-2">
            <button onClick={() => { setAddModuleForm(false); setNewModuleTitle(''); }} className="btn-ghost flex flex-1 items-center justify-center gap-1 border border-[var(--border)] text-sm">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button onClick={handleAddModule} disabled={addingModule || !newModuleTitle.trim()} className="btn-primary flex flex-1 items-center justify-center gap-1 text-sm">
              {addingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Crear módulo
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddModuleForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] py-3 text-sm text-[var(--muted)] transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          <Plus className="h-4 w-4" /> Agregar módulo
        </button>
      )}
    </div>
  );
}

// ── DetailsTab ────────────────────────────────────────────────────────────────

function DetailsTab({ course, onSaved }: { course: CourseData; onSaved: (c: Partial<CourseData>) => void }) {
  const [form, setForm] = useState({
    title:         course.title,
    slug:          course.slug,
    description:   course.description ?? '',
    thumbnail_url: course.thumbnail_url ?? '',
    level:         course.level,
    language:      course.language,
    tags:          course.tags.join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/courses/${course.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:         form.title,
        slug:          form.slug,
        description:   form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        level:         form.level,
        language:      form.language,
        tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { course: updated } = await res.json();
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Título</label>
        <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Slug</label>
          <input value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} required pattern="[a-z0-9-]+" className="input font-mono text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Thumbnail URL</label>
          <input value={form.thumbnail_url} onChange={e => setForm(f => ({...f, thumbnail_url: e.target.value}))} placeholder="https://…" className="input text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Descripción</label>
        <textarea rows={4} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Nivel</label>
          <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className="input">
            <option value="beginner">Básico</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Idioma</label>
          <select value={form.language} onChange={e => setForm(f => ({...f, language: e.target.value}))} className="input">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Etiquetas</label>
        <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="python, programación" className="input" />
        <p className="mt-1 text-xs text-[var(--muted)]">Separadas por comas.</p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-brand-600">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
      </div>
    </form>
  );
}

// ── Main page (wrapped in Suspense for useSearchParams) ───────────────────────

function EditCourseContent() {
  const params  = useParams();
  const search  = useSearchParams();
  const courseId = params.id as string;

  const [course,     setCourse]     = useState<CourseData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [tab, setTab] = useState<'details' | 'curriculum'>(
    search.get('tab') === 'curriculum' ? 'curriculum' : 'details'
  );

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then(r => r.json())
      .then(data => { setCourse(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [courseId]);

  async function togglePublish() {
    if (!course) return;
    setPublishing(true);
    const res = await fetch(`/api/courses/${courseId}/publish`, { method: 'POST' });
    if (res.ok) {
      const { course: updated } = await res.json();
      setCourse(c => c ? { ...c, is_published: updated.is_published } : null);
    }
    setPublishing(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-[var(--muted)]">Curso no encontrado</p>
        <Link href="/instructor" className="btn-primary">Volver</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/instructor" className="btn-ghost mt-1 rounded-lg p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight text-[var(--text)]">{course.title}</h1>
            <p className="mt-0.5 text-sm">
              {course.is_published
                ? <span className="font-medium text-brand-600">● Publicado</span>
                : <span className="text-gray-400">○ Borrador</span>
              }
            </p>
          </div>
        </div>
        <button
          onClick={togglePublish}
          disabled={publishing}
          className={clsx('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', course.is_published
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            : 'btn-primary',
          )}
        >
          {publishing
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : course.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
          }
          {course.is_published ? 'Retirar' : 'Publicar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <nav className="flex">
          {(['details', 'curriculum'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]',
              )}
            >
              {t === 'details' ? 'Detalles' : 'Currículo'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        {tab === 'details' ? (
          <DetailsTab
            course={course}
            onSaved={(updated) => setCourse(c => c ? { ...c, ...updated } : null)}
          />
        ) : (
          <CurriculumEditor courseId={courseId} initialModules={course.modules ?? []} />
        )}
      </div>
    </div>
  );
}

export default function EditCoursePage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>}>
      <EditCourseContent />
    </Suspense>
  );
}
