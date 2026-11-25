import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    select: {
      id: true,
      governorateAr: true,
      governorateEn: true,
      cityAr: true,
      cityEn: true,
      areaAr: true,
      areaEn: true,
      feePiasters: true,
      freeDeliveryOverPiasters: true,
    },
    orderBy: [{ governorateAr: 'asc' }, { cityAr: 'asc' }, { areaAr: 'asc' }],
  });
  return NextResponse.json({ zones }, { headers: { 'Cache-Control': 'no-store' } });
}

