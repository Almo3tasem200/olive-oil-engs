import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from '@/backend/db';
import { sha256 } from '@/backend/security';
import type { AdminRole } from '@/generated/prisma/client';

export type SessionAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

const cookieName = process.env.SESSION_COOKIE_NAME || 'emo_admin_session';

export async function getCurrentAdmin(): Promise<SessionAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token || token.length > 200) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { adminUser: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.adminUser.isActive
  ) {
    return null;
  }

  return {
    id: session.adminUser.id,
    email: session.adminUser.email,
    name: session.adminUser.name,
    role: session.adminUser.role,
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('UNAUTHORIZED');
  return admin;
}

export async function requireOwner() {
  const admin = await requireAdmin();
  if (admin.role !== 'OWNER') throw new Error('FORBIDDEN');
  return admin;
}

export function sessionCookieName() {
  return cookieName;
}

