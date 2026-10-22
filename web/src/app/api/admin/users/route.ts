import { NextRequest } from 'next/server';
import { proxyAdmin, SERVICES } from '../proxy';

export function GET(req: NextRequest) {
  return proxyAdmin(req, `${SERVICES.auth}/auth/admin/users`, { query: ['search', 'role', 'page'] });
}

export function POST(req: NextRequest) {
  return proxyAdmin(req, `${SERVICES.auth}/auth/admin/users`, {
    method: 'POST',
    fields: ['email', 'fullName', 'role', 'password'],
  });
}
