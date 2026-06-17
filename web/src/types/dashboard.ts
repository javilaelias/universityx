export interface Student {
  id: string;
  fullName: string;
  avatarUrl?: string;
  streakDays: number;
  totalBadges: number;
}

export interface LiveSession {
  id: string;
  title: string;
  courseName: string;
  instructorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string;
  attendeeCount: number;
}

export type TaskType = "assignment" | "quiz" | "live_session";
export type TaskPriority = "low" | "medium" | "high";

export interface PendingTask {
  id: string;
  title: string;
  courseName: string;
  dueDate: Date;
  type: TaskType;
  priority: TaskPriority;
  estimatedMinutes: number;
}

export interface CourseProgress {
  id: string;
  title: string;
  thumbnailUrl: string;
  progressPct: number;
  lastAccessedAt: Date;
  nextContentTitle: string;
  nextContentType: TaskType;
  offlineAvailable: boolean;
  totalModules: number;
  completedModules: number;
}

export interface AIRecommendation {
  id: string;
  contentTitle: string;
  courseName: string;
  thumbnailUrl: string;
  reason: string;
  confidence: number;
  contentType: TaskType;
  durationMinutes: number;
}

export type SyncStatus = "synced" | "syncing" | "pending" | "offline";

export interface DashboardData {
  student: Student;
  liveSessionsToday: LiveSession[];
  pendingTasks: PendingTask[];
  courseProgress: CourseProgress[];
  aiRecommendations: AIRecommendation[];
  syncStatus: SyncStatus;
  pendingSyncCount: number;
}
