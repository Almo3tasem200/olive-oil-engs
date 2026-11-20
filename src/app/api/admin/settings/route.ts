import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageSettings } from '@/lib/permissions';
import { isSameOriginRequest } from '@/lib/csrf';
import { settingsSchema } from '@/lib/validation';
import { parseBody, apiFailure, unauthorized, forbidden } from '@/lib/http';
import { writeAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageSettings(admin.role)) return forbidden();

  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageSettings(admin.role)) return forbidden();

  const parsed = await parseBody(request, settingsSchema);
  if (!parsed.success) return parsed.response;

  try {
    const before = await prisma.storeSettings.findUnique({ where: { id: 1 } });
    const data = parsed.data;
    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...data,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        publicAddressAr: data.publicAddressAr || null,
        publicAddressEn: data.publicAddressEn || null,
        hoursAr: data.hoursAr || null,
        hoursEn: data.hoursEn || null,
        deliveryPolicyAr: data.deliveryPolicyAr || null,
        deliveryPolicyEn: data.deliveryPolicyEn || null,
        updatedById: admin.id,
      },
      update: {
        ...data,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        publicAddressAr: data.publicAddressAr || null,
        publicAddressEn: data.publicAddressEn || null,
        hoursAr: data.hoursAr || null,
        hoursEn: data.hoursEn || null,
        deliveryPolicyAr: data.deliveryPolicyAr || null,
        deliveryPolicyEn: data.deliveryPolicyEn || null,
        updatedById: admin.id,
      },
    });

    await writeAudit({
      adminUserId: admin.id,
      action: 'STORE_SETTINGS_UPDATED',
      entityType: 'StoreSettings',
      entityId: '1',
      before: before ? { codEnabled: before.codEnabled } : undefined,
      after: { codEnabled: settings.codEnabled },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}

