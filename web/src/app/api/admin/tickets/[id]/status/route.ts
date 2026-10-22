import { NextRequest, NextResponse } from 'next/server';
import { isUuid, proxyAdmin, SERVICES } from '../../../proxy';

export function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  return proxyAdmin(req, `${SERVICES.helpdesk}/api/tickets/${params.id}/status`, {
    method: 'PUT',
    fields: ['status'],
  });
}
