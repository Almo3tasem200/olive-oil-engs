import { NextResponse } from 'next/server';
import { quoteCart } from '@/backend/orders';
import { parseBody, apiFailure } from '@/backend/http';
import { quoteSchema } from '@/backend/validation';
import { clientAddress, consumeRateLimit } from '@/backend/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rate = await consumeRateLimit('quote:' + clientAddress(request), 30, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Please wait before requesting another quote.' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  const parsed = await parseBody(request, quoteSchema);
  if (!parsed.success) return parsed.response;

  try {
    return NextResponse.json(await quoteCart(parsed.data), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return apiFailure(error);
  }
}

