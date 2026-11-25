import 'server-only';
import { prisma } from '@/backend/db';
import { publicMediaUrl } from '@/backend/media';

export async function getPublicProducts(locale: 'ar' | 'en' = 'ar') {
  const products = await prisma.product.findMany({
    where: { isActive: true, isAvailable: true },
    include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] } },
    orderBy: [{ isFeatured: 'desc' }, { volumeMl: 'asc' }],
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: locale === 'ar' ? product.nameAr : product.nameEn,
    shortDescription: locale === 'ar' ? product.shortDescriptionAr : product.shortDescriptionEn,
    description: locale === 'ar' ? product.descriptionAr : product.descriptionEn,
    volumeMl: product.volumeMl,
    packaging: product.packaging,
    pricePiasters: product.pricePiasters,
    images: product.images.map((image) => ({
      id: image.id,
      url: publicMediaUrl(image.objectKey),
      alt: locale === 'ar' ? image.altAr : image.altEn,
      isPrimary: image.isPrimary,
    })),
  }));
}

export async function getPublicProductBySlug(slug: string, locale: 'ar' | 'en' = 'ar') {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, isAvailable: true },
    include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] } },
  });

  if (!product) return null;
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: locale === 'ar' ? product.nameAr : product.nameEn,
    shortDescription: locale === 'ar' ? product.shortDescriptionAr : product.shortDescriptionEn,
    description: locale === 'ar' ? product.descriptionAr : product.descriptionEn,
    volumeMl: product.volumeMl,
    packaging: product.packaging,
    pricePiasters: product.pricePiasters,
    images: product.images.map((image) => ({
      id: image.id,
      url: publicMediaUrl(image.objectKey),
      alt: locale === 'ar' ? image.altAr : image.altEn,
      isPrimary: image.isPrimary,
    })),
  };
}

