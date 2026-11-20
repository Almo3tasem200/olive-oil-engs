import argon2 from 'argon2';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clientAddress, consumeRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validation';
import { isSameOriginRequest } from '@/lib/csrf';
import { parseBody } from '@/lib/http';
import { createCustomerSession, setCustomerSessionCookie } from '@/lib/customer-auth';

export const runtime = 'nodejs';
let dummyHash: Promise<string> | null = null;

async function passwordHashForUnknownAccount() {
  dummyHash ??= argon2.hash('not-a-real-customer-password', { type: argon2.argon2id });
  return dummyHash;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const parsed = await parseBody(request, loginSchema);
  if (!parsed.success) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const address = clientAddress(request);
  const [accountLimit, addressLimit] = await Promise.all([
    consumeRateLimit('customer-login-account:' + email, 8, 900),
    consumeRateLimit('customer-login-address:' + address, 40, 900),
  ]);
  if (!accountLimit.allowed || !addressLimit.allowed) {
    const retryAfterSeconds = Math.max(accountLimit.retryAfterSeconds, addressLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const customer = await prisma.customerAccount.findUnique({ where: { email } });
  const hash = customer?.passwordHash ?? await passwordHashForUnknownAccount();
  const valid = await argon2.verify(hash, parsed.data.password).catch(() => false);
  if (!customer || !customer.isActive || !valid) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  const session = await createCustomerSession(customer.id);
  const response = NextResponse.json({ customer: { name: customer.name, email: customer.email } });
  setCustomerSessionCookie(response, session.token, session.expiresAt);
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
