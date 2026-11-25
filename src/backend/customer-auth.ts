import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/backend/db';
import { newOpaqueToken, sha256 } from '@/backend/security';

const cookieName = 'emo_customer_session';

export type SessionCustomer = {
  id: string;
  email: string;
  name: string;
};

export async function getCurrentCustomer(): Promise<SessionCustomer | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token || token.length > 200) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { customer: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.customer.isActive
  ) {
    return null;
  }

  return {
    id: session.customer.id,
    email: session.customer.email,
    name: session.customer.name,
  };
}

export async function createCustomerSession(
  customerId: string,
  db: Pick<Prisma.TransactionClient, 'customerSession'> = prisma,
) {
  const token = newOpaqueToken();
  const ttlDays = Math.min(30, Math.max(1, Number(process.env.CUSTOMER_SESSION_TTL_DAYS || 7)));
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await db.customerSession.create({
    data: { customerId, tokenHash: sha256(token), expiresAt },
  });

  return { token, expiresAt };
}

export function setCustomerSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
  response.headers.set('Cache-Control', 'no-store');
}

export async function revokeCurrentCustomerSession(token: string | undefined) {
  if (!token || token.length > 200) return;
  await prisma.customerSession.updateMany({
    where: { tokenHash: sha256(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function clearCustomerSessionCookie(response: NextResponse) {
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  response.headers.set('Cache-Control', 'no-store');
}

export function customerSessionCookieName() {
  return cookieName;
}
