import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/backend/customer-auth';
import { prisma } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: 'Sign in to view your account.' }, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const orders = await prisma.order.findMany({
    where: { customerAccountId: customer.id },
    select: { orderNumber: true, status: true, totalPiasters: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    customer: { name: customer.name, email: customer.email },
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      totalPiasters: order.totalPiasters,
      createdAt: order.createdAt.toISOString(),
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
