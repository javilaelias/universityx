import { getSession } from 'next-auth/react';

const LMS_URL = process.env.NEXT_PUBLIC_LMS_SERVICE_URL ?? 'http://localhost:4002';

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session?.accessToken) return {};
  return { Authorization: `Bearer ${session.accessToken}` };
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeader();
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...headers, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDashboard: () =>
    apiFetch<DashboardApiResponse>(`${LMS_URL}/api/dashboard`),

  getCourses: (params?: { search?: string; level?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.level)  qs.set('level',  params.level);
    if (params?.page)   qs.set('page',   String(params.page));
    return apiFetch<CoursesApiResponse>(`${LMS_URL}/api/courses?${qs}`);
  },

  getCourse: (id: string) =>
    apiFetch<CourseDetailResponse>(`${LMS_URL}/api/courses/${id}`),

  enroll: (courseId: string) =>
    apiFetch<{ enrollment: unknown }>(`${LMS_URL}/api/enrollments`, {
      method: 'POST',
      body:   JSON.stringify({ courseId }),
    }),

  updateProgress: (payload: {
    contentItemId: string;
    isCompleted?: boolean;
    progressSeconds?: number;
    quizAttemptId?: string;
    idempotencyKey?: string;
  }) =>
    apiFetch<{ progress: unknown }>(`${LMS_URL}/api/progress`, {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),

  getQuiz: (quizId: string) =>
    apiFetch<QuizResponse>(`${LMS_URL}/api/quizzes/${quizId}`),

  submitQuiz: (quizId: string, answers: Record<string, string>) =>
    apiFetch<QuizResultResponse>(`${LMS_URL}/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body:   JSON.stringify({ answers }),
    }),
};

// ── Response shapes ──────────────────────────────────────────────────────────

export interface DashboardApiResponse {
  student:             StudentInfo;
  course_progress:     CourseProgressItem[];
  live_sessions_today: LiveSessionItem[];
  pending_tasks:       PendingTaskItem[];
  ai_recommendations:  unknown[];
  sync_status:         string;
  pending_sync_count:  number;
}

export interface StudentInfo {
  id: string; full_name: string; role: string;
  avatar_url: string | null; timezone: string;
}

export interface CourseProgressItem {
  enrollment_id:   string;
  course_id:       string;
  course_title:    string;
  progress_pct:    number;
  completed_count: number;
  total_count:     number;
  next_content_id?:    string;
  next_content_title?: string;
}

export interface LiveSessionItem {
  id: string; title: string; starts_at: string;
  duration_minutes: number; meeting_url: string | null;
}

export interface PendingTaskItem {
  content_id:    string;
  content_title: string;
  content_type:  string;
  module_title:  string;
  course_title:  string;
  due_date:      string | null;
}

export interface CoursesApiResponse {
  courses:    CourseCard[];
  total:      number;
  page:       number;
  totalPages: number;
}

export interface CourseCard {
  id: string; title: string; description: string;
  level: string; price: number | null; thumbnail_url: string | null;
  instructor_name: string; enrolled_count: number;
}

export interface CourseDetailResponse {
  course: CourseCard & {
    modules: Array<{
      id: string; title: string; order_index: number;
      content_items: Array<{
        id: string; title: string; content_type: string;
        duration_minutes: number | null; order_index: number;
      }>;
    }>;
  };
}

export interface QuizResponse {
  quiz:      { id: string; title: string; passing_score: number; max_attempts: number };
  questions: Array<{
    id: string; question_text: string; options: Array<{
      id: string; option_text: string;
    }>;
  }>;
}

export interface QuizResultResponse {
  score: number; passed: boolean; correct: number; total: number;
}
