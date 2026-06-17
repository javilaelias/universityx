import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';

const HELPDESK = process.env.HELPDESK_SERVICE_URL ?? 'http://localhost:4004';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const page = req.nextUrl.searchParams.get('page') ?? '1';

  const res = await fetch(`${HELPDESK}/api/tickets?page=${page}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const res  = await fetch(`${HELPDESK}/api/tickets`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
    body:    JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
