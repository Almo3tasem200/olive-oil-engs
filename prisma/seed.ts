import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/el_mohandeseen?schema=public',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.storeSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      businessNameAr: 'زيت زيتون المهندسين',
      businessNameEn: 'El Mohandeseen Olive Oil',
      codEnabled: true,
    },
    update: {},
  });

  await prisma.deliveryZone.createMany({
    data: [
      {
        code: 'NEW-CAIRO',
        governorateAr: 'القاهرة',
        governorateEn: 'Cairo',
        cityAr: 'القاهرة الجديدة',
        cityEn: 'New Cairo',
        areaAr: 'القاهرة الجديدة',
        areaEn: 'New Cairo',
        feePiasters: 0,
        freeDeliveryOverPiasters: null,
        isActive: true,
      },
      {
        code: 'CAIRO-REST',
        governorateAr: 'القاهرة',
        governorateEn: 'Cairo',
        cityAr: 'القاهرة',
        cityEn: 'Cairo',
        areaAr: 'باقي القاهرة',
        areaEn: 'Rest of Cairo',
        feePiasters: 5000,
        freeDeliveryOverPiasters: null,
        isActive: true,
      },
      {
        code: 'GIZA',
        governorateAr: 'الجيزة',
        governorateEn: 'Giza',
        cityAr: 'الجيزة',
        cityEn: 'Giza',
        areaAr: 'جميع مناطق الجيزة',
        areaEn: 'All Giza areas',
        feePiasters: 8000,
        freeDeliveryOverPiasters: null,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  const products = [
    {
      sku: 'OLIVE-OIL-500ML',
      slug: 'olive-oil-500ml',
      nameAr: 'زيت زيتون - 500 مل',
      nameEn: 'Olive Oil - 500 ml',
      shortDescriptionAr: 'عبوة بلاستيك داكنة - 500 مل',
      shortDescriptionEn: 'Dark plastic bottle - 500 ml',
      volumeMl: 500,
      packaging: 'DARK_PLASTIC_BOTTLE' as const,
      pricePiasters: 27500,
    },
    {
      sku: 'OLIVE-OIL-1L',
      slug: 'olive-oil-1l',
      nameAr: 'زيت زيتون - 1 لتر',
      nameEn: 'Olive Oil - 1 liter',
      shortDescriptionAr: 'عبوة بلاستيك داكنة - 1 لتر',
      shortDescriptionEn: 'Dark plastic bottle - 1 liter',
      volumeMl: 1000,
      packaging: 'DARK_PLASTIC_BOTTLE' as const,
      pricePiasters: 55000,
    },
    {
      sku: 'OLIVE-OIL-12L',
      slug: 'olive-oil-12l',
      nameAr: 'زيت زيتون - 12 لتر',
      nameEn: 'Olive Oil - 12 liters',
      shortDescriptionAr: 'جركن بلاستيك - 12 لتر',
      shortDescriptionEn: 'Plastic jerrycan - 12 liters',
      volumeMl: 12000,
      packaging: 'PLASTIC_JERRYCAN' as const,
      pricePiasters: 610000,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      create: { ...product, isActive: false, isAvailable: true },
      update: {
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        shortDescriptionAr: product.shortDescriptionAr,
        shortDescriptionEn: product.shortDescriptionEn,
        volumeMl: product.volumeMl,
        packaging: product.packaging,
      },
    });
  }

  console.log('Store settings, delivery zones, and three catalog products are ready. Products remain unpublished until approved photos are uploaded.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

