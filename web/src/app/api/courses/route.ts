import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const LMS = process.env.LMS_SERVICE_URL ?? 'http://localhost:4002';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const search = req.nextUrl.searchParams.get('search') ?? '';
  const level  = req.nextUrl.searchParams.get('level')  ?? '';
  const page   = req.nextUrl.searchParams.get('page')   ?? '1';

  const qs = new URLSearchParams({ page });
  if (search) qs.set('search', search);
  if (level)  qs.set('level', level);

  const res = await fetch(`${LMS}/api/courses?${qs}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    next:    { revalidate: 120 },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
