import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const LMS = process.env.LMS_SERVICE_URL ?? 'http://localhost:4002';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const res = await fetch(`${LMS}/api/instructor/courses`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache:   'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
