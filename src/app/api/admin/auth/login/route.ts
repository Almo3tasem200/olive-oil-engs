import argon2 from 'argon2';
import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { clientAddress, consumeRateLimit } from '@/backend/rate-limit';
import { sha256, newOpaqueToken } from '@/backend/security';
import { loginSchema } from '@/backend/validation';
import { isSameOriginRequest } from '@/backend/csrf';
import { parseBody } from '@/backend/http';
import { sessionCookieName } from '@/backend/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const parsed = await parseBody(request, loginSchema);
  if (!parsed.success) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const address = clientAddress(request);
  const [accountLimit, addressLimit] = await Promise.all([
    consumeRateLimit('login-account:' + email, 8, 900),
    consumeRateLimit('login-address:' + address, 40, 900),
  ]);
  if (!accountLimit.allowed || !addressLimit.allowed) {
    const retryAfterSeconds = Math.max(accountLimit.retryAfterSeconds, addressLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = user?.isActive
    ? await argon2.verify(user.passwordHash, parsed.data.password).catch(() => false)
    : await argon2.hash(parsed.data.password).then(() => false);

  if (!user || !user.isActive || !valid) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  const token = newOpaqueToken();
  const ttlDays = Math.min(30, Math.max(1, Number(process.env.SESSION_TTL_DAYS || 7)));
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: { adminUserId: user.id, tokenHash: sha256(token), expiresAt },
  });

  const response = NextResponse.json({
    admin: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

