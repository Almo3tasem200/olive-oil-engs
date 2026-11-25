import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { publicMediaUrl } from '@/backend/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    settings: settings
      ? {
          businessNameAr: settings.businessNameAr,
          businessNameEn: settings.businessNameEn,
          codEnabled: settings.codEnabled,
          phone: settings.phone,
          whatsapp: settings.whatsapp,
          logoUrl: settings.logoObjectKey ? publicMediaUrl(settings.logoObjectKey) : null,
        }
      : { businessNameAr: 'زيت زيتون المهندسين', businessNameEn: 'El Mohandeseen Olive Oil', codEnabled: true, phone: null, whatsapp: null, logoUrl: null },
  }, { headers: { 'Cache-Control': 'no-store' } });
}

