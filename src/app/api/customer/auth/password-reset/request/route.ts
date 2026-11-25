import { randomInt, randomUUID, createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/backend/csrf';
import { prisma } from '@/backend/db';
import { parseBody } from '@/backend/http';
import { clientAddress, consumeRateLimit } from '@/backend/rate-limit';
import { passwordResetIsConfigured, sendPasswordResetCode } from '@/backend/password-reset-email';
import { passwordResetRequestSchema } from '@/backend/validation';

export const runtime = 'nodejs';

function codeHash(challengeId: string, customerId: string, code: string) {
  const key = Buffer.from(process.env.APP_ENCRYPTION_KEY!, 'hex');
  return createHmac('sha256', key).update(`${challengeId}:${customerId}:${code}`).digest('hex');
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const parsed = await parseBody(request, passwordResetRequestSchema);
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
    consumeRateLimit(`customer-password-reset-request:${email}`, 3, 900),
    consumeRateLimit(`customer-password-reset-request-address:${address}`, 12, 900),
  ]);
  if (!emailLimit.allowed || !addressLimit.allowed) {
    const retryAfterSeconds = Math.max(emailLimit.retryAfterSeconds, addressLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many reset requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' } },
    );
  }

  const customer = await prisma.customerAccount.findUnique({
    where: { email },
    select: { id: true, name: true, isActive: true },
  });
  if (customer?.isActive) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const hash = codeHash(id, customer.id, code);

    await prisma.$transaction(async (tx) => {
      await tx.customerPasswordReset.updateMany({
        where: { customerId: customer.id, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.customerPasswordReset.create({
        data: { id, customerId: customer.id, codeHash: hash, expiresAt },
      });
    });

    const sent = await sendPasswordResetCode(email, customer.name, code);
    if (!sent) {
      await prisma.customerPasswordReset.updateMany({
        where: { id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    }
  }

  return NextResponse.json(
    { message: 'If an account exists for that email, a reset code has been sent.' },
    { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } },
  );
}
