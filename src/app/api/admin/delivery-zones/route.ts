import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageDelivery } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { deliveryZoneSchema } from '@/lib/validation';
import { parseEgpToPiasters } from '@/lib/money';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';
import { writeAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageDelivery(admin.role)) return forbidden();

  const zones = await prisma.deliveryZone.findMany({ orderBy: [{ governorateAr: 'asc' }, { cityAr: 'asc' }, { areaAr: 'asc' }] });
  return NextResponse.json({
    zones: zones.map((zone) => ({
      ...zone,
      feeEgp: (zone.feePiasters / 100).toFixed(2),
      freeDeliveryOverEgp: zone.freeDeliveryOverPiasters === null
        ? ''
        : (zone.freeDeliveryOverPiasters / 100).toFixed(2),
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageDelivery(admin.role)) return forbidden();

  const parsed = await parseBody(request, deliveryZoneSchema);
  if (!parsed.success) return parsed.response;

  try {
    const zone = await prisma.deliveryZone.create({
      data: {
        code: parsed.data.code,
        governorateAr: parsed.data.governorateAr,
        governorateEn: parsed.data.governorateEn,
        cityAr: parsed.data.cityAr,
        cityEn: parsed.data.cityEn,
        areaAr: parsed.data.areaAr,
        areaEn: parsed.data.areaEn,
        feePiasters: parseEgpToPiasters(parsed.data.feeEgp),
        freeDeliveryOverPiasters: parsed.data.freeDeliveryOverEgp
          ? parseEgpToPiasters(parsed.data.freeDeliveryOverEgp)
          : null,
        isActive: parsed.data.isActive,
      },
    });
    await writeAudit({
      adminUserId: admin.id,
      action: 'DELIVERY_ZONE_CREATED',
      entityType: 'DeliveryZone',
      entityId: zone.id,
      after: { code: zone.code, feePiasters: zone.feePiasters, isActive: zone.isActive },
    });
    return NextResponse.json({ id: zone.id }, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}

