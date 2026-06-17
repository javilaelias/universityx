"use client";

import { useDashboard } from "@/hooks/useDashboard";
import type {
  CourseProgress,
  LiveSession,
  PendingTask,
  AIRecommendation,
  SyncStatus,
} from "@/types/dashboard";

// ─── Utilidades ──────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 0) return "Hace un momento";
  if (diffMin < 60) return `En ${diffMin} min`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `En ${diffHrs}h`;
  return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

function formatDueDate(date: Date): { label: string; isUrgent: boolean } {
  const now = new Date();
  const diffHrs = (date.getTime() - now.getTime()) / 3_600_000;
  if (diffHrs < 24) return { label: "Hoy", isUrgent: true };
  if (diffHrs < 48) return { label: "Mañana", isUrgent: true };
  return {
    label: date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
    isUrgent: false,
  };
}

// ─── Indicador de Sincronización ─────────────────────────────────────────────

function SyncBadge({ status, pendingCount }: { status: SyncStatus; pendingCount: number }) {
  const config: Record<SyncStatus, { color: string; icon: string; label: string }> = {
    synced:  { color: "bg-emerald-500", icon: "●", label: "En línea" },
    syncing: { color: "bg-amber-400 animate-pulse", icon: "↻", label: "Sincronizando..." },
    pending: { color: "bg-amber-400", icon: "⏸", label: `${pendingCount} pendientes` },
    offline: { color: "bg-red-500", icon: "✕", label: "Sin conexión" },
  };
  const { color, icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

// ─── Tarjeta de Sesión en Vivo ────────────────────────────────────────────────

function LiveSessionCard({ session }: { session: LiveSession }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
      <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center text-white text-lg">
        🎥
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{session.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.courseName} · {session.instructorName}</p>
        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-1">
          {formatRelativeTime(session.scheduledAt)} · {session.durationMinutes} min · {session.attendeeCount} inscritos
        </p>
      </div>
      <a
        href={session.meetingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
      >
        Unirse
      </a>
    </div>
  );
}

// ─── Tarjeta de Tarea Pendiente ───────────────────────────────────────────────

const TASK_ICONS: Record<string, string> = {
  assignment: "📝",
  quiz: "✏️",
  live_session: "🎥",
};

function TaskCard({ task }: { task: PendingTask }) {
  const { label, isUrgent } = formatDueDate(task.dueDate);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
      <span className="text-xl flex-shrink-0">{TASK_ICONS[task.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.courseName}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isUrgent ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
          {label}
        </span>
        <p className="text-xs text-gray-400 mt-0.5">~{task.estimatedMinutes} min</p>
      </div>
    </div>
  );
}

// ─── Tarjeta de Progreso de Curso ─────────────────────────────────────────────

function ProgressCard({ course }: { course: CourseProgress }) {
  const pct = Math.round(course.progressPct);

  return (
    <div className="group p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex gap-3">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2">
              {course.title}
            </p>
            {course.offlineAvailable && (
              <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                Offline
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            Módulos: {course.completedModules}/{course.totalModules} · Siguiente: {course.nextContentTitle}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progreso</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-3">
        <button className="w-full py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ─── Tarjeta de Recomendación IA ──────────────────────────────────────────────

function AIRecommendationCard({ rec }: { rec: AIRecommendation }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/10 dark:to-violet-900/10 border border-blue-100 dark:border-blue-800 hover:shadow-sm transition-shadow cursor-pointer">
      <img
        src={rec.thumbnailUrl}
        alt={rec.contentTitle}
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{rec.contentTitle}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{rec.courseName}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">💡 {rec.reason}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
          {Math.round(rec.confidence * 100)}%
        </span>
        <p className="text-xs text-gray-400">{rec.durationMinutes} min</p>
      </div>
    </div>
  );
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4 md:p-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

interface IntelligentDashboardProps {
  userId: string;
}

export default function IntelligentDashboard({ userId }: IntelligentDashboardProps) {
  const { data, isLoading, error, syncStatus, refresh } = useDashboard(userId);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">No se pudo cargar el dashboard</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { student, liveSessionsToday, pendingTasks, courseProgress, aiRecommendations, pendingSyncCount } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "¡Buenos días" : hour < 18 ? "¡Buenas tardes" : "¡Buenas noches";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.fullName} className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                {student.fullName[0]}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{greeting}, {student.fullName.split(" ")[0]}! 👋</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-amber-500 font-semibold">🔥 {student.streakDays} días seguidos</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-yellow-500 font-semibold">🏅 {student.totalBadges} insignias</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncBadge status={syncStatus} pendingCount={pendingSyncCount} />
            <button
              onClick={refresh}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              title="Actualizar"
            >
              ↻
            </button>
          </div>
        </header>

        {/* ── Sesiones en Vivo Hoy ── */}
        {liveSessionsToday.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span className="text-violet-500">🔴</span> Clases en vivo hoy
            </h2>
            <div className="space-y-2">
              {liveSessionsToday.map((s) => (
                <LiveSessionCard key={s.id} session={s} />
              ))}
            </div>
          </section>
        )}

        {/* ── Progreso de Cursos ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>📚</span> Mis cursos
            </h2>
            <a href="/cursos" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseProgress.map((course) => (
              <ProgressCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        {/* ── Tareas Pendientes + Recomendaciones IA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span>⏰</span> Tareas pendientes
              {pendingTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  {pendingTasks.length}
                </span>
              )}
            </h2>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">¡Sin tareas pendientes! 🎉</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span>🤖</span> Recomendado para ti
            </h2>
            {aiRecommendations.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Explorando nuevas recomendaciones...</p>
            ) : (
              <div className="space-y-2">
                {aiRecommendations.map((rec) => (
                  <AIRecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
