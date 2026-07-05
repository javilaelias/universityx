import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MEDIA = process.env.MEDIA_SERVICE_URL ?? 'http://localhost:4008';

// Reenvía el stream multipart tal cual (sin parsear en Next.js) para no bufferear
// el video completo en memoria del server — importante en videos de cientos de MB.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const contentType = req.headers.get('content-type');
  if (!contentType?.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Content-Type multipart/form-data requerido' }, { status: 400 });
  }

  const upstream = await fetch(`${MEDIA}/api/media/upload`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': contentType },
    body:    req.body,
    duplex:  'half',
  } as RequestInit);

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
