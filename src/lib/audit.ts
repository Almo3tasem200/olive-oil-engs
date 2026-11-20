import 'server-only';
import { prisma } from '@/lib/db';

export async function writeAudit(input: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  requestId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.before === undefined ? null : JSON.stringify(input.before),
      afterJson: input.after === undefined ? null : JSON.stringify(input.after),
      requestId: input.requestId?.slice(0, 100),
    },
  });
}

