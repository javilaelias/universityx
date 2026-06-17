import { NextRequest, NextResponse } from 'next/server';

// Proxy al init de SAML del auth-service.
// Necesitamos el redirect server-side para leer AUTH_EXTERNAL_URL en runtime.
export async function GET(req: NextRequest) {
  const institution = req.nextUrl.searchParams.get('institution') ?? '';
  const authExt = process.env.AUTH_EXTERNAL_URL ?? 'http://localhost:4001';
  const dest = `${authExt}/auth/sso/init?institution=${encodeURIComponent(institution)}`;
  return NextResponse.redirect(dest);
}
