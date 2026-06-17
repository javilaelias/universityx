import { NextRequest, NextResponse } from 'next/server';

const CRED_URL = process.env.CREDENTIALS_SERVICE_URL ?? 'http://localhost:4007';

// Public endpoint — no auth required, proxies PDF from credentials-service
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const upstream = await fetch(`${CRED_URL}/credentials/${params.id}/pdf`, {
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Credencial no encontrada' }, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${params.id.slice(0, 8)}.pdf"`,
    },
  });
}
