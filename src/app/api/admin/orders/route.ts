import { OrderStatus } from '@/generated/prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageOrders } from '@/backend/permissions';
import { unauthorized, forbidden } from '@/backend/http';

export const runtime = 'nodejs';

const allowedStatuses = new Set<string>(Object.values(OrderStatus));

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageOrders(admin.role)) return forbidden();

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const status = url.searchParams.get('status') || '';
  const fromValue = url.searchParams.get('from');
  const toValue = url.searchParams.get('to');
  const page = Math.min(10000, Math.max(1, Number(url.searchParams.get('page') || 1)));
  const pageSize = 25;

  const from = fromValue ? new Date(fromValue) : null;
  const to = toValue ? new Date(toValue) : null;
  const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
  const validTo = to && !Number.isNaN(to.getTime()) ? to : null;

  const where = {
    ...(allowedStatuses.has(status) ? { status: status as OrderStatus } : {}),
    ...(validFrom || validTo ? {
      createdAt: {
        ...(validFrom ? { gte: validFrom } : {}),
        ...(validTo ? { lte: validTo } : {}),
      },
    } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: 'insensitive' as const } },
            { customerName: { contains: q, mode: 'insensitive' as const } },
            { customerPhone: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        area: true,
        status: true,
        paymentStatus: true,
        totalPiasters: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, pageSize }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

