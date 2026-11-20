import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageProducts } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { apiFailure, unauthorized, forbidden } from '@/lib/http';
import { deleteMediaObject, publicMediaUrl, storeProductImage, MediaError } from '@/lib/media';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageProducts(admin.role)) return forbidden();

  let stored: { objectKey: string; width: number; height: number; byteLength: number } | null = null;
  let committed = false;

  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a product photo.' }, { status: 400 });
    }
    const max = Number(process.env.MAX_UPLOAD_BYTES || 12_582_912);
    if (file.size < 1 || file.size > max) {
      return NextResponse.json({ error: 'Image exceeds the upload size limit.' }, { status: 413 });
    }

    const altAr = String(form.get('altAr') || product.nameAr).trim().slice(0, 200);
    const altEn = String(form.get('altEn') || product.nameEn).trim().slice(0, 200);
    const makePrimary = form.get('primary') === 'true' || product.images.length === 0;
    stored = await storeProductImage(id, Buffer.from(await file.arrayBuffer()));

    const image = await prisma.$transaction(async (tx) => {
      if (makePrimary) {
        await tx.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
      }
      const created = await tx.productImage.create({
        data: {
          productId: id,
          objectKey: stored!.objectKey,
          altAr,
          altEn,
          sortOrder: product.images.length,
          isPrimary: makePrimary,
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PRODUCT_IMAGE_UPLOADED',
          entityType: 'Product',
          entityId: id,
          afterJson: JSON.stringify({ imageId: created.id, width: stored!.width, height: stored!.height, byteLength: stored!.byteLength }),
        },
      });
      return created;
    });
    committed = true;

    return NextResponse.json({
      image: { id: image.id, url: publicMediaUrl(image.objectKey), altAr: image.altAr, altEn: image.altEn, isPrimary: image.isPrimary },
    }, { status: 201 });
  } catch (error) {
    if (stored && !committed) await deleteMediaObject(stored.objectKey);
    if (error instanceof MediaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiFailure(error);
  }
}

