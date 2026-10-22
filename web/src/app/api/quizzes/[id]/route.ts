import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';
import { toQuiz }                    from '@/lib/lms-shape';

const LMS = process.env.LMS_SERVICE_URL ?? 'http://localhost:4002';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const res = await fetch(`${LMS}/api/quizzes/${params.id}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  const data = await res.json();
  return NextResponse.json(res.ok ? toQuiz(data) : data, { status: res.status });
}
