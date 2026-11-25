import { NextResponse } from 'next/server';
import { checkoutSchema } from '@/backend/validation';
import { createOrder } from '@/backend/orders';
import { CommerceError, quoteCart } from '@/backend/orders';
import { parseBody, apiFailure } from '@/backend/http';
import { clientAddress, consumeRateLimit } from '@/backend/rate-limit';
import { isSameOriginRequest } from '@/backend/csrf';
import { getCurrentCustomer } from '@/backend/customer-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rate = await consumeRateLimit('checkout:' + clientAddress(request), 8, 3600);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many order attempts. Please wait or contact the store.' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: 'Sign in to complete your order.' }, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const parsed = await parseBody(request, checkoutSchema);
  if (!parsed.success) return parsed.response;

  try {
    const result = await createOrder(parsed.data, customer.id);
    const response = NextResponse.json({
      orderNumber: result.orderNumber,
      totalPiasters: result.totalPiasters,
      existing: result.existing,
    }, { status: result.existing ? 200 : 201 });

    response.cookies.set('emo_order_confirmation', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 14 * 24 * 60 * 60,
    });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    if (error instanceof CommerceError && error.code === 'QUOTE_CHANGED') {
      const currentQuote = await quoteCart({
        items: parsed.data.items,
        deliveryZoneId: parsed.data.deliveryZoneId,
      }).catch(() => null);
      return NextResponse.json({ error: error.message, code: error.code, currentQuote }, {
        status: error.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return apiFailure(error);
  }
}

