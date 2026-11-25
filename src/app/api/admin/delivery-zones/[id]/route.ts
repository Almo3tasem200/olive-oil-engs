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

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageDelivery(admin.role)) return forbidden();

  const parsed = await parseBody(request, deliveryZoneSchema);
  if (!parsed.success) return parsed.response;

  try {
    const { id } = await context.params;
    const before = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: 'Delivery area not found.' }, { status: 404 });

    const after = await prisma.deliveryZone.update({
      where: { id },
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
      action: 'DELIVERY_ZONE_UPDATED',
      entityType: 'DeliveryZone',
      entityId: id,
      before: { feePiasters: before.feePiasters, isActive: before.isActive },
      after: { feePiasters: after.feePiasters, isActive: after.isActive },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

