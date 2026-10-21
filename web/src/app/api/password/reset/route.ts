import { NextRequest } from 'next/server';
import { proxyPassword } from '../proxy';

export function POST(req: NextRequest) {
  return proxyPassword(req, 'reset-password', ['token', 'password']);
}
