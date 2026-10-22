import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';

export const SERVICES = {
  auth:     process.env.AUTH_SERVICE_URL     ?? 'http://localhost:4001',
  lms:      process.env.LMS_SERVICE_URL      ?? 'http://localhost:4002',
  helpdesk: process.env.HELPDESK_SERVICE_URL ?? 'http://localhost:4004',
} as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string) => UUID_RE.test(id);

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  query?:  readonly string[];   // parámetros de la URL que se reenvían (lista blanca)
  fields?: readonly string[];   // campos del body que se reenvían (lista blanca)
};

// Proxy de /api/admin/*: exige sesión con rol admin; el servicio vuelve a validar el rol.
export async function proxyAdmin(req: NextRequest, url: string, opts: Options = {}) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });

  const method = opts.method ?? 'GET';
  const qs = new URLSearchParams();
  for (const key of opts.query ?? []) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) qs.set(key, value);
  }

  let body: string | undefined;
  if (opts.fields) {
    // Exige JSON: un form `text/plain` de otro sitio (CSRF) no pasa.
    if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Content-Type debe ser application/json' }, { status: 415 });
    }
    const src = await req.json().catch(() => null);
    if (!src || typeof src !== 'object') return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    const data = src as Record<string, unknown>;
    body = JSON.stringify(Object.fromEntries(opts.fields.filter((f) => f in data).map((f) => [f, data[f]])));
  }

  try {
    const search   = qs.toString();
    const upstream = await fetch(`${url}${search ? `?${search}` : ''}`, {
      method,
      cache:   'no-store',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 502 });
  }
}
