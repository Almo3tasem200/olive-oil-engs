import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageProducts } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { newProductSchema } from '@/lib/validation';
import { parseEgpToPiasters } from '@/lib/money';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';
import { publicMediaUrl } from '@/lib/media';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageProducts(admin.role)) return forbidden();

  const products = await prisma.product.findMany({
    include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      ...product,
      priceEgp: (product.pricePiasters / 100).toFixed(2),
      images: product.images.map((image) => ({ ...image, url: publicMediaUrl(image.objectKey) })),
    })),
    role: admin.role,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();

  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'OWNER') return forbidden();

  const parsed = await parseBody(request, newProductSchema);
  if (!parsed.success) return parsed.response;

  try {
    const data = parsed.data;
    if (data.isActive) {
      return NextResponse.json({ error: 'Upload and approve product photos before publishing.' }, { status: 409 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
        sku: data.sku,
        slug: data.slug,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        shortDescriptionAr: data.shortDescriptionAr || null,
        shortDescriptionEn: data.shortDescriptionEn || null,
        descriptionAr: data.descriptionAr || null,
        descriptionEn: data.descriptionEn || null,
        volumeMl: data.volumeMl,
        packaging: data.packaging,
        pricePiasters: parseEgpToPiasters(data.priceEgp),
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        isActive: false,
        updatedById: admin.id,
      },
      });

      await tx.productPriceHistory.create({
        data: {
          productId: created.id,
        changedById: admin.id,
        oldPricePiasters: 0,
        newPricePiasters: created.pricePiasters,
        reason: 'Initial price',
      },
      });

      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: created.id,
          afterJson: JSON.stringify({ sku: created.sku, slug: created.slug, pricePiasters: created.pricePiasters, isActive: false }),
        },
      });
      return created;
    });

    return NextResponse.json({ product: { id: product.id, sku: product.sku } }, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}

