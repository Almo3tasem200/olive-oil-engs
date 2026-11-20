import argon2 from 'argon2';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/csrf';
import { prisma } from '@/lib/db';
import { parseBody } from '@/lib/http';
import { clientAddress, consumeRateLimit } from '@/lib/rate-limit';
import { passwordResetIsConfigured } from '@/lib/password-reset-email';
import { passwordResetCompleteSchema } from '@/lib/validation';

export const runtime = 'nodejs';

function codeHash(challengeId: string, customerId: string, code: string) {
  const key = Buffer.from(process.env.APP_ENCRYPTION_KEY!, 'hex');
  return createHmac('sha256', key).update(`${challengeId}:${customerId}:${code}`).digest('hex');
}

function hashesMatch(expected: string, actual: string) {
  if (!/^[a-f0-9]{64}$/i.test(expected) || !/^[a-f0-9]{64}$/i.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}

function invalidCodeResponse() {
  return NextResponse.json(
    { error: 'That code is invalid or expired. Request a new code and try again.' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const parsed = await parseBody(request, passwordResetCompleteSchema);
  if (!parsed.success) return parsed.response;
  if (!passwordResetIsConfigured()) {
    return NextResponse.json(
      { error: 'Password recovery is not configured yet. Please contact the store for help.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const address = clientAddress(request);
  const [emailLimit, addressLimit] = await Promise.all([
    consumeRateLimit(`customer-password-reset-complete:${email}`, 10, 900),
    consumeRateLimit(`customer-password-reset-complete-address:${address}`, 30, 900),
  ]);
  if (!emailLimit.allowed || !addressLimit.allowed) {
    const retryAfterSeconds = Math.max(emailLimit.retryAfterSeconds, addressLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many reset attempts. Request a new code later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' } },
    );
  }

  const customer = await prisma.customerAccount.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });
  if (!customer?.isActive) return invalidCodeResponse();

  const now = new Date();
  const challenge = await prisma.customerPasswordReset.findFirst({
    where: {
      customerId: customer.id,
      consumedAt: null,
      expiresAt: { gt: now },
      attempts: { lt: 5 },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!challenge) return invalidCodeResponse();

  const actualHash = codeHash(challenge.id, customer.id, parsed.data.code);
  if (!hashesMatch(challenge.codeHash, actualHash)) {
    await prisma.customerPasswordReset.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: 5 },
      },
      data: { attempts: { increment: 1 } },
    });
    return invalidCodeResponse();
  }

  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  const updated = await prisma.$transaction(async (tx) => {
    const consumed = await tx.customerPasswordReset.updateMany({
      where: {
        id: challenge.id,
        customerId: customer.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
        codeHash: challenge.codeHash,
      },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) return false;

    await tx.customerAccount.update({ where: { id: customer.id }, data: { passwordHash } });
    await tx.customerSession.updateMany({
      where: { customerId: customer.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return true;
  });

  if (!updated) return invalidCodeResponse();
  return NextResponse.json(
    { message: 'Your password has been changed. Sign in with your new password.' },
    { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } },
  );
}
