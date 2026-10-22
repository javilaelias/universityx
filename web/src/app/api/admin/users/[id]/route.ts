import { NextRequest, NextResponse } from 'next/server';
import { isUuid, proxyAdmin, SERVICES } from '../../proxy';

export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  return proxyAdmin(req, `${SERVICES.auth}/auth/admin/users/${params.id}`, {
    method: 'PATCH',
    fields: ['role', 'isActive'],
  });
}
