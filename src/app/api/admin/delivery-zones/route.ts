import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageDelivery } from '@/backend/permissions';
import { isSameOriginRequest } from '@/backend/csrf';
import { deliveryZoneSchema } from '@/backend/validation';
import { parseEgpToPiasters } from '@/shared/money';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/backend/http';
import { writeAudit } from '@/backend/audit';

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
        feePiasters: parseEgpToPiasters(parsed.data.feeEgp, { allowZero: true }),
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

