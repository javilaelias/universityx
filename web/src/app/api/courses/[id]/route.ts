import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toCourseDetail } from '@/lib/lms-shape';

const LMS = process.env.LMS_SERVICE_URL ?? 'http://localhost:4002';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const res = await fetch(`${LMS}/api/courses/${params.id}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache:   'no-store', // trae `enrolled` del usuario
  });

  const data = await res.json();
  return NextResponse.json(res.ok ? toCourseDetail(data) : data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${LMS}/api/courses/${params.id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
    body:    JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const res = await fetch(`${LMS}/api/courses/${params.id}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
