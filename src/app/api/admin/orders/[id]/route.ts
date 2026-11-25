import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageOrders } from '@/backend/permissions';
import { isSameOriginRequest } from '@/backend/csrf';
import { orderStatusSchema } from '@/backend/validation';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/backend/http';
import { validStatusTransition } from '@/backend/order-rules';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageOrders(admin.role)) return forbidden();

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { include: { adminUser: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
      notes: { include: { adminUser: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      deliveryZone: true,
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageOrders(admin.role)) return forbidden();

  const parsed = await parseBody(request, orderStatusSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { id } = await context.params;
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) return null;
      if (!validStatusTransition(order.status, parsed.data.status)) {
        throw Object.assign(new Error('This status change is not allowed.'), { status: 409, code: 'INVALID_TRANSITION' });
      }
      if (parsed.data.status === 'CANCELLED' && !parsed.data.note) {
        throw Object.assign(new Error('Add a cancellation reason.'), { status: 400, code: 'CANCELLATION_REASON_REQUIRED' });
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: parsed.data.status },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: parsed.data.status,
          adminUserId: admin.id,
          note: parsed.data.note || null,
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'ORDER_STATUS_CHANGED',
          entityType: 'Order',
          entityId: id,
          beforeJson: JSON.stringify({ status: order.status }),
          afterJson: JSON.stringify({ status: updated.status, note: parsed.data.note || null }),
        },
      });
      return updated;
    });

    if (!result) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    return apiFailure(error);
  }
}

