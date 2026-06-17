export type UserRole       = 'student' | 'instructor' | 'admin' | 'support';
export type CourseLevel    = 'beginner' | 'intermediate' | 'advanced';
export type ContentType    = 'video' | 'document' | 'quiz' | 'assignment' | 'live_session';
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'expired';

// ── DB row types (snake_case = columnas PostgreSQL) ───────────────────────────

export interface Course {
  id:                string;
  title:             string;
  slug:              string;
  description:       string | null;
  instructor_id:     string | null;
  thumbnail_url:     string | null;
  level:             CourseLevel;
  duration_hours:    number | null;
  language:          string;
  tags:              string[];
  is_published:      boolean;
  drip_enabled:      boolean;
  drip_interval_days:number;
  created_at:        Date;
}

export interface Module {
  id:              string;
  course_id:       string;
  title:           string;
  description:     string | null;
  position:        number;
  release_date:    Date | null;
  is_downloadable: boolean;
  is_locked?:      boolean; // campo calculado (drip)
}

export interface ContentItem {
  id:               string;
  module_id:        string;
  type:             ContentType;
  title:            string;
  description:      string | null;
  content_url:      string | null;
  duration_seconds: number | null;
  position:         number;
  offline_size_mb:  number | null;
  is_free_preview:  boolean;
  transcript_url:   string | null;
}

export interface Enrollment {
  id:               string;
  user_id:          string;
  course_id:        string;
  enrolled_at:      Date;
  completed_at:     Date | null;
  progress_pct:     number;
  last_accessed_at: Date | null;
}

export interface Progress {
  id:                 string;
  user_id:            string;
  content_item_id:    string;
  completed:          boolean;
  progress_seconds:   number;
  score:              number | null;
  attempts:           number;
  last_position_sec:  number;
  is_offline_pending: boolean;
  completed_at:       Date | null;
}

export interface QuizQuestion {
  id:          string;
  quiz_id:     string;
  text:        string;
  explanation: string | null;
  position:    number;
  points:      number;
  options:     QuizOption[];
}

export interface QuizOption {
  id:         string;
  text:       string;
  position:   number;
  is_correct?: boolean; // solo visible para instructores/admin
}

export interface QuizAttempt {
  id:              string;
  user_id:         string;
  content_item_id: string;
  answers:         Record<string, string>; // questionId → optionId
  score:           number | null;
  passed:          boolean | null;
  submitted_at:    Date;
}

// ── JwtPayload (compartido con auth-service) ──────────────────────────────────
export interface JwtPayload {
  sub:   string;
  email: string;
  role:  UserRole;
}

declare global {
  namespace Express {
    interface Request { user?: JwtPayload; }
  }
}
