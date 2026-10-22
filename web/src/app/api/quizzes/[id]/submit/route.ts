import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';
import { toQuizResult }              from '@/lib/lms-shape';

const LMS = process.env.LMS_SERVICE_URL ?? 'http://localhost:4002';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${LMS}/api/quizzes/${params.id}/submit`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(res.ok ? toQuizResult(data) : data, { status: res.status });
}
