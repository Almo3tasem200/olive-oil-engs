import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/el_mohandeseen?schema=public',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  if (settings) {
    const missingSettings: {
      logoObjectKey?: string;
      phone?: string;
      whatsapp?: string;
      facebookUrl?: string;
      instagramUrl?: string;
    } = {};
    if (!settings.logoObjectKey) missingSettings.logoObjectKey = 'reference/brand-logo.jpg';
    if (!settings.phone) missingSettings.phone = '+201013678135';
    if (!settings.whatsapp) missingSettings.whatsapp = '201013678135';
    if (!settings.facebookUrl) missingSettings.facebookUrl = 'https://www.facebook.com/share/1GmCs6ZeWz/';
    if (!settings.instagramUrl) missingSettings.instagramUrl = 'https://www.instagram.com/engineersoliveoil/';
    if (Object.keys(missingSettings).length) {
      await prisma.storeSettings.update({ where: { id: 1 }, data: missingSettings });
    }
  }

  const products = [
    {
      sku: 'OLIVE-OIL-500ML',
      nameAr: 'زيت زيتون صغير (بلاستيك)',
      nameEn: 'Olive Oil S (Plastic)',
      descriptionAr: 'عبوة زيت زيتون بلاستيكية - 500 مل',
      descriptionEn: 'Plastic olive oil bottle - 500 ml',
      objectKey: 'reference/olive-oil-500ml.jpg',
      altAr: 'عبوة زيت زيتون المهندسين سعة 500 مل',
      altEn: 'El Mohandeseen Olive Oil 500 ml bottle',
    },
    {
      sku: 'OLIVE-OIL-1L',
      nameAr: 'زيت زيتون وسط (بلاستيك)',
      nameEn: 'Olive Oil M (Plastic)',
      descriptionAr: 'عبوة زيت زيتون بلاستيكية - 1 لتر',
      descriptionEn: 'Plastic olive oil bottle - 1 liter',
      objectKey: 'reference/olive-oil-1l.jpg',
      altAr: 'عبوة زيت زيتون المهندسين سعة لتر واحد',
      altEn: 'El Mohandeseen Olive Oil 1 liter bottle',
    },
    {
      sku: 'OLIVE-OIL-12L',
      nameAr: 'زيت زيتون - 12 لتر',
      nameEn: 'Olive Oil - 12 liters',
      descriptionAr: 'جركن بلاستيك - 12 لتر',
      descriptionEn: 'Plastic jerrycan - 12 liters',
      objectKey: 'reference/olive-oil-12l.jpg',
      altAr: 'عبوة زيت زيتون سعة 12 لتر',
      altEn: 'Dark plastic 12 liter olive oil jerrycan',
    },
  ];

  for (const asset of products) {
    const product = await prisma.product.findUnique({ where: { sku: asset.sku } });
    if (!product) {
      console.warn(`Skipped ${asset.sku}: run the catalog seed first.`);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        nameAr: asset.nameAr,
        nameEn: asset.nameEn,
        shortDescriptionAr: asset.descriptionAr,
        shortDescriptionEn: asset.descriptionEn,
        isActive: true,
      },
    });

    await prisma.productImage.upsert({
      where: { objectKey: asset.objectKey },
      create: {
        productId: product.id,
        objectKey: asset.objectKey,
        altAr: asset.altAr,
        altEn: asset.altEn,
        sortOrder: 0,
        isPrimary: true,
      },
      update: {
        productId: product.id,
        altAr: asset.altAr,
        altEn: asset.altEn,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }

  console.log('Reference logo, store contact links, and matching 500 ml, 1 liter, and 12 liter product photos imported. Existing database prices were not changed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
