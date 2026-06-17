import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';
import type { DashboardData, AIRecommendation } from '@/types/dashboard';
import type { DashboardApiResponse } from '@/lib/api';

const LMS = process.env.LMS_SERVICE_URL ?? 'http://localhost:4002';
const AI  = process.env.AI_SERVICE_URL  ?? 'http://localhost:4006';

interface AiRec {
  content_item_id: string;
  item_title:      string;
  course_title:    string;
  content_type:    string;
  duration_seconds?: number;
  reason:          string;
  confidence:      number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (session.user.id !== params.userId) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  const authHeader = { Authorization: `Bearer ${session.accessToken}` };

  // Fetch LMS data and AI recommendations in parallel
  const [lmsRes, aiRes] = await Promise.allSettled([
    fetch(`${LMS}/api/dashboard`, { headers: authHeader, next: { revalidate: 60 } }),
    fetch(`${AI}/recommendations/${params.userId}`, { headers: authHeader, next: { revalidate: 300 } }),
  ]);

  if (lmsRes.status === 'rejected' || !lmsRes.value.ok) {
    const err = lmsRes.status === 'fulfilled'
      ? await lmsRes.value.json().catch(() => ({}))
      : {};
    return NextResponse.json(err, { status: lmsRes.status === 'fulfilled' ? lmsRes.value.status : 503 });
  }

  const raw: DashboardApiResponse = await lmsRes.value.json();

  let aiRecommendations: AIRecommendation[] = [];
  if (aiRes.status === 'fulfilled' && aiRes.value.ok) {
    const aiData = await aiRes.value.json().catch(() => ({ recommendations: [] }));
    aiRecommendations = (aiData.recommendations as AiRec[]).map((r) => ({
      id:              r.content_item_id,
      contentTitle:    r.item_title,
      courseName:      r.course_title,
      thumbnailUrl:    '',
      reason:          r.reason,
      confidence:      r.confidence,
      contentType:     (r.content_type === 'quiz' ? 'quiz' : 'assignment') as AIRecommendation['contentType'],
      durationMinutes: r.duration_seconds ? Math.round(r.duration_seconds / 60) : 5,
    }));
  }

  const mapped: DashboardData = {
    student: {
      id:          raw.student.id,
      fullName:    raw.student.full_name,
      avatarUrl:   raw.student.avatar_url ?? undefined,
      streakDays:  0,
      totalBadges: 0,
    },
    courseProgress: raw.course_progress.map(c => ({
      id:               c.enrollment_id,
      title:            c.course_title,
      thumbnailUrl:     '',
      progressPct:      Number(c.progress_pct),
      lastAccessedAt:   new Date(),
      nextContentTitle: c.next_content_title ?? 'Continuar',
      nextContentType:  'assignment' as const,
      offlineAvailable: false,
      totalModules:     c.total_count,
      completedModules: c.completed_count,
    })),
    liveSessionsToday: raw.live_sessions_today.map(s => ({
      id:              s.id,
      title:           s.title,
      courseName:      '',
      instructorName:  '',
      scheduledAt:     new Date(s.starts_at),
      durationMinutes: s.duration_minutes,
      meetingUrl:      s.meeting_url ?? '#',
      attendeeCount:   0,
    })),
    pendingTasks: raw.pending_tasks.map(t => ({
      id:               t.content_id,
      title:            t.content_title,
      courseName:       t.course_title,
      dueDate:          t.due_date ? new Date(t.due_date) : new Date(),
      type:             (t.content_type === 'quiz' ? 'quiz' : 'assignment') as 'quiz' | 'assignment',
      priority:         'medium' as const,
      estimatedMinutes: 15,
    })),
    aiRecommendations,
    syncStatus:       raw.sync_status as 'synced',
    pendingSyncCount: raw.pending_sync_count,
  };

  return NextResponse.json(mapped);
}
