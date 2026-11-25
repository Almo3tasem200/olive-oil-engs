import { NextResponse } from 'next/server';
import { getPublicProducts } from '@/backend/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('locale') === 'en' ? 'en' : 'ar';
  const products = await getPublicProducts(locale);
  return NextResponse.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
}

