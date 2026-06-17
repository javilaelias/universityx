import { NextRequest, NextResponse } from 'next/server';

const CRED_URL = process.env.CREDENTIALS_SERVICE_URL ?? 'http://localhost:4007';

// Public endpoint: proxies badge verification (no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const upstream = await fetch(`${CRED_URL}/credentials/${params.id}`);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
