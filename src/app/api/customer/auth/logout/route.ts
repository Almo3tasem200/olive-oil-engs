import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clearCustomerSessionCookie,
  customerSessionCookieName,
  revokeCurrentCustomerSession,
} from '@/lib/customer-auth';
import { isSameOriginRequest } from '@/lib/csrf';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const cookieStore = await cookies();
  await revokeCurrentCustomerSession(cookieStore.get(customerSessionCookieName())?.value);
  const response = NextResponse.json({ ok: true });
  clearCustomerSessionCookie(response);
  return response;
}
