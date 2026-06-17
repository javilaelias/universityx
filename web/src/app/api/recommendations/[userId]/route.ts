import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AI_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:4006';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.id !== params.userId && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const upstream = await fetch(`${AI_URL}/recommendations/${params.userId}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    next: { revalidate: 300 },
  });

  if (!upstream.ok) {
    return NextResponse.json({ recommendations: [], generated_at: new Date().toISOString() });
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
