import argon2 from 'argon2';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clientAddress, consumeRateLimit } from '@/lib/rate-limit';
import { customerRegistrationSchema } from '@/lib/validation';
import { isSameOriginRequest } from '@/lib/csrf';
import { parseBody } from '@/lib/http';
import { createCustomerSession, setCustomerSessionCookie } from '@/lib/customer-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const parsed = await parseBody(request, customerRegistrationSchema);
  if (!parsed.success) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const address = clientAddress(request);
  const [accountLimit, addressLimit] = await Promise.all([
    consumeRateLimit('customer-register-account:' + email, 4, 900),
    consumeRateLimit('customer-register-address:' + address, 20, 900),
  ]);
  if (!accountLimit.allowed || !addressLimit.allowed) {
    const retryAfterSeconds = Math.max(accountLimit.retryAfterSeconds, addressLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many account attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const existing = await prisma.customerAccount.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
  }

  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  try {
    const { customer, session } = await prisma.$transaction(async (tx) => {
      const created = await tx.customerAccount.create({
        data: { email, name: parsed.data.name, passwordHash },
        select: { id: true, name: true, email: true },
      });
      const customerSession = await createCustomerSession(created.id, tx);
      return { customer: created, session: customerSession };
    });
    const response = NextResponse.json({ customer: { name: customer.name, email: customer.email } }, { status: 201 });
    setCustomerSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }
    throw error;
  }
}
