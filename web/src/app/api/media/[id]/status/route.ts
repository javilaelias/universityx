import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MEDIA = process.env.MEDIA_SERVICE_URL ?? 'http://localhost:4008';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const res = await fetch(`${MEDIA}/api/media/${params.id}/status`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache:   'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
