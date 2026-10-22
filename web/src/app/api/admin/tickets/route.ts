import { NextRequest } from 'next/server';
import { proxyAdmin, SERVICES } from '../proxy';

export function GET(req: NextRequest) {
  return proxyAdmin(req, `${SERVICES.helpdesk}/api/tickets/queue`, { query: ['status', 'page'] });
}
