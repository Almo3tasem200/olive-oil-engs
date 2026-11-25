import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageProducts } from '@/backend/permissions';
import { isSameOriginRequest } from '@/backend/csrf';
import { unauthorized, forbidden, apiFailure } from '@/backend/http';
import { deleteMediaObject } from '@/backend/media';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageProducts(admin.role)) return forbidden();

  try {
    const { id, imageId } = await context.params;
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
    if (!image) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
      await tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PRODUCT_IMAGE_SET_PRIMARY',
          entityType: 'Product',
          entityId: id,
          afterJson: JSON.stringify({ imageId }),
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageProducts(admin.role)) return forbidden();

  try {
    const { id, imageId } = await context.params;
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
    if (!image) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });
      const remaining = await tx.productImage.findMany({
        where: { productId: id },
        orderBy: { sortOrder: 'asc' },
      });
      if (remaining.length && !remaining.some((item) => item.isPrimary)) {
        await tx.productImage.update({ where: { id: remaining[0].id }, data: { isPrimary: true } });
      }
      if (!remaining.length) {
        await tx.product.update({ where: { id }, data: { isActive: false } });
      }
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PRODUCT_IMAGE_DELETED',
          entityType: 'Product',
          entityId: id,
          beforeJson: JSON.stringify({ imageId }),
          afterJson: JSON.stringify({ imageCount: remaining.length }),
        },
      });
    });

    await deleteMediaObject(image.objectKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

