import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageProducts } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { productContentSchema } from '@/lib/validation';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();

  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageProducts(admin.role)) return forbidden();

  const parsed = await parseBody(request, productContentSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { id } = await context.params;
    const before = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!before) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    if (parsed.data.isActive && before.images.length === 0) {
      return NextResponse.json({ error: 'Upload at least one real product photo before publishing.' }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      const after = await tx.product.update({
        where: { id },
        data: {
          ...parsed.data,
          shortDescriptionAr: parsed.data.shortDescriptionAr || null,
          shortDescriptionEn: parsed.data.shortDescriptionEn || null,
          descriptionAr: parsed.data.descriptionAr || null,
          descriptionEn: parsed.data.descriptionEn || null,
          updatedById: admin.id,
        },
      });

      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PRODUCT_UPDATED',
          entityType: 'Product',
          entityId: id,
          beforeJson: JSON.stringify({ nameAr: before.nameAr, nameEn: before.nameEn, isActive: before.isActive, isAvailable: before.isAvailable }),
          afterJson: JSON.stringify({ nameAr: after.nameAr, nameEn: after.nameEn, isActive: after.isActive, isAvailable: after.isAvailable }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

