import 'server-only';
import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/db';

function opaqueKey(value: string) {
  const secret = process.env.APP_ENCRYPTION_KEY || 'development-only-rate-key';
  return createHmac('sha256', secret).update(value).digest('hex');
}

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const start = new Date(Math.floor(now / windowMs) * windowMs);
  const bucketKey = opaqueKey(key);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { bucketKey_windowStart: { bucketKey, windowStart: start } },
    create: { bucketKey, windowStart: start, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((start.getTime() + windowMs - now) / 1000)),
  };
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

