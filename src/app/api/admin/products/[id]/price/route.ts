import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canEditPrices } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { priceUpdateSchema } from '@/lib/validation';
import { parseEgpToPiasters } from '@/lib/money';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();

  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canEditPrices(admin.role)) return forbidden();

  const parsed = await parseBody(request, priceUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { id } = await context.params;
    const newPricePiasters = parseEgpToPiasters(parsed.data.priceEgp);

    const existing = await prisma.product.findUnique({ where: { id }, select: { pricePiasters: true } });
    if (!existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    if (existing.pricePiasters === newPricePiasters) {
      return NextResponse.json({ error: 'The new price must differ from the current price.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) return null;

      await tx.product.update({
        where: { id },
        data: { pricePiasters: newPricePiasters, updatedById: admin.id },
      });

      await tx.productPriceHistory.create({
        data: {
          productId: id,
          changedById: admin.id,
          oldPricePiasters: product.pricePiasters,
          newPricePiasters,
          reason: parsed.data.reason || null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PRODUCT_PRICE_CHANGED',
          entityType: 'Product',
          entityId: id,
          beforeJson: JSON.stringify({ pricePiasters: product.pricePiasters }),
          afterJson: JSON.stringify({ pricePiasters: newPricePiasters, reason: parsed.data.reason || null }),
          requestId: request.headers.get('x-request-id')?.slice(0, 100) || null,
        },
      });

      return { oldPricePiasters: product.pricePiasters, newPricePiasters };
    });

    if (!result) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      priceEgp: (result.newPricePiasters / 100).toFixed(2),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiFailure(error);
  }
}

