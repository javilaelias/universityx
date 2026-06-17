import { NextResponse }  from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/lib/auth';

const NOTIF = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4003';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });

  try {
    const res = await fetch(`${NOTIF}/notifications/count`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      next:    { revalidate: 0 },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
