import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageSettings } from '@/backend/permissions';
import { isSameOriginRequest } from '@/backend/csrf';
import { unauthorized, forbidden, apiFailure } from '@/backend/http';
import { MediaError, deleteMediaObject, publicMediaUrl, storeBrandLogo } from '@/backend/media';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();
  if (!canManageSettings(admin.role)) return forbidden();

  let stored: { objectKey: string } | null = null;
  let committed = false;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a logo image.' }, { status: 400 });
    const max = Number(process.env.MAX_UPLOAD_BYTES || 12_582_912);
    if (file.size < 1 || file.size > max) return NextResponse.json({ error: 'Image exceeds the upload size limit.' }, { status: 413 });

    stored = await storeBrandLogo(Buffer.from(await file.arrayBuffer()));
    const before = await prisma.storeSettings.findUnique({ where: { id: 1 } });
    await prisma.$transaction(async (tx) => {
      await tx.storeSettings.upsert({
        where: { id: 1 },
        create: { id: 1, logoObjectKey: stored!.objectKey, updatedById: admin.id },
        update: { logoObjectKey: stored!.objectKey, updatedById: admin.id },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'STORE_LOGO_UPDATED',
          entityType: 'StoreSettings',
          entityId: '1',
          beforeJson: JSON.stringify({ logoObjectKey: before?.logoObjectKey || null }),
          afterJson: JSON.stringify({ logoObjectKey: stored!.objectKey }),
        },
      });
    });
    committed = true;
    if (before?.logoObjectKey) await deleteMediaObject(before.logoObjectKey).catch(() => undefined);
    return NextResponse.json({ url: publicMediaUrl(stored.objectKey) });
  } catch (error) {
    if (stored && !committed) await deleteMediaObject(stored.objectKey);
    if (error instanceof MediaError) return NextResponse.json({ error: error.message }, { status: 400 });
    return apiFailure(error);
  }
}

