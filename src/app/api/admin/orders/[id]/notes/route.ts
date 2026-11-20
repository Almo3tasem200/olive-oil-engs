import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageOrders } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { orderNoteSchema } from '@/lib/validation';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';

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

