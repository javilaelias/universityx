import { NextRequest, NextResponse } from 'next/server';

const AUTH = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${AUTH}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
