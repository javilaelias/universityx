import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CRED_URL = process.env.CREDENTIALS_SERVICE_URL ?? 'http://localhost:4007';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${CRED_URL}/credentials`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!upstream.ok) {
    return NextResponse.json({ credentials: [], total: 0 });
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const upstream = await fetch(`${CRED_URL}/credentials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
