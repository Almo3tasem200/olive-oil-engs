import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageOrders } from '@/backend/permissions';
import { isSameOriginRequest } from '@/backend/csrf';
import { orderNoteSchema } from '@/backend/validation';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/backend/http';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageOrders(admin.role)) return forbidden();

  const parsed = await parseBody(request, orderNoteSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const note = await prisma.orderNote.create({
      data: { orderId: id, adminUserId: admin.id, body: parsed.data.body },
      include: { adminUser: { select: { name: true } } },
    });
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'ORDER_NOTE_ADDED',
        entityType: 'Order',
        entityId: id,
        afterJson: JSON.stringify({ noteId: note.id }),
      },
    });
    return NextResponse.json({ note: { id: note.id, body: note.body, createdAt: note.createdAt, adminName: note.adminUser.name } }, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}

