import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';

const NOTIF = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4003';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const unread = req.nextUrl.searchParams.get('unread') ?? '';
  const limit  = req.nextUrl.searchParams.get('limit')  ?? '20';

  const qs = new URLSearchParams({ limit });
  if (unread) qs.set('unread', unread);

  const res = await fetch(`${NOTIF}/notifications?${qs}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

// PUT /api/notifications — mark all as read
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const res = await fetch(`${NOTIF}/notifications/read-all`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
