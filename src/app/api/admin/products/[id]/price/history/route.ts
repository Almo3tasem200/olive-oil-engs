import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canEditPrices } from '@/lib/permissions';
import { unauthorized, forbidden } from '@/lib/http';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canEditPrices(admin.role)) return forbidden();

  const { id } = await context.params;
  const history = await prisma.productPriceHistory.findMany({
    where: { productId: id },
    include: { changedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return NextResponse.json({
    history: history.map((entry) => ({
      ...entry,
      oldPriceEgp: (entry.oldPricePiasters / 100).toFixed(2),
      newPriceEgp: (entry.newPricePiasters / 100).toFixed(2),
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
