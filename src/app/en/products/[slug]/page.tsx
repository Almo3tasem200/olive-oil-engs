import type { Metadata } from 'next';
import { ProductDetailView } from '@/frontend/components/store/ProductDetailView';
import { getPublicProductBySlug } from '@/backend/catalog';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug, 'en');
  if (!product) return { title: 'Product unavailable' };
  return {
    title: product.name,
    description: product.shortDescription || product.name,
    openGraph: { title: product.name, description: product.shortDescription || product.name },
  };
}

export default async function EnglishProductPage({ params }: Context) {
  const { slug } = await params;
  return <ProductDetailView slug={slug} locale='en' />;
}

