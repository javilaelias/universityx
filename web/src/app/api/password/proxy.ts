import { NextRequest, NextResponse } from 'next/server';
import { forwardedForHeader } from '@/lib/client-ip';

const AUTH = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001';

// Reenvía a auth-service solo los campos permitidos. Exige JSON: un form `text/plain`
// de otro sitio (CSRF) no pasa.
export async function proxyPassword(req: NextRequest, path: string, fields: readonly string[]) {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Content-Type debe ser application/json' }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const src = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const payload = Object.fromEntries(fields.filter((f) => f in src).map((f) => [f, src[f]]));

  // El limitador de auth-service cuenta por IP: se pasa la del cliente (ver client-ip.ts).
  const headers = { 'Content-Type': 'application/json', ...forwardedForHeader(req.headers.get('x-forwarded-for')) };

  try {
    const upstream = await fetch(`${AUTH}/auth/${path}`, {
      method: 'POST',
      headers,
      body:   JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 502 });
  }
}
