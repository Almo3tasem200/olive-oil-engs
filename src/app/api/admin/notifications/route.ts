import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageOrders } from '@/backend/permissions';
import { isSameOriginRequest } from '@/backend/csrf';
import { parseBody, unauthorized, forbidden } from '@/backend/http';

export const runtime = 'nodejs';

const markReadSchema = z.object({ id: z.string().uuid() }).strict();

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageOrders(admin.role)) return forbidden();

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { channel: 'ADMIN_DASHBOARD', readAt: null } }),
    prisma.notification.findMany({
      where: { channel: 'ADMIN_DASHBOARD' },
      include: { order: { select: { orderNumber: true, customerName: true, totalPiasters: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  return NextResponse.json({ unreadCount, notifications }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageOrders(admin.role)) return forbidden();

  const parsed = await parseBody(request, markReadSchema);
  if (!parsed.success) return parsed.response;

  await prisma.notification.updateMany({
    where: { id: parsed.data.id, channel: 'ADMIN_DASHBOARD' },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

