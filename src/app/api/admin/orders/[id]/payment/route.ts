import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/csrf';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';

const paymentSchema = z.object({
  status: z.enum(['UNPAID', 'PAID']),
}).strict();

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'OWNER' && admin.role !== 'MANAGER') return forbidden();

  const parsed = await parseBody(request, paymentSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { id } = await context.params;
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) return null;
      if (order.status === 'CANCELLED' && parsed.data.status === 'PAID') {
        throw Object.assign(new Error('Cancelled orders cannot be marked as collected.'), { status: 409 });
      }
      const updated = await tx.order.update({
        where: { id },
        data: { paymentStatus: parsed.data.status },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'ORDER_PAYMENT_STATUS_CHANGED',
          entityType: 'Order',
          entityId: id,
          beforeJson: JSON.stringify({ paymentStatus: order.paymentStatus }),
          afterJson: JSON.stringify({ paymentStatus: updated.paymentStatus }),
        },
      });
      return updated;
    });
    if (!result) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, paymentStatus: result.paymentStatus });
  } catch (error) {
    return apiFailure(error);
  }
}

