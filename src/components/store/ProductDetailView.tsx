import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicProductBySlug } from '@/lib/catalog';
import { prisma } from '@/lib/db';
import { formatEgp } from '@/lib/money';
import { StorePageShell } from '@/components/store/StorePageShell';
import { AddToCartPanel } from '@/components/store/AddToCartPanel';
import { capacityLabel, packageLabel } from '@/components/store/ProductCard';

export async function ProductDetailView({ slug, locale = 'ar' }: { slug: string; locale?: 'ar' | 'en' }) {
  const [product, settings] = await Promise.all([
    getPublicProductBySlug(slug, locale),
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
  ]);
  if (!product) notFound();

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell grid gap-8 py-10 md:grid-cols-2 md:py-16'>
        <div className='relative min-h-72 overflow-hidden rounded-3xl bg-[var(--olive-100)] md:min-h-[520px]'>
          {product.images[0] && (
            <Image src={product.images[0].url} alt={product.images[0].alt || product.name} fill priority sizes='(max-width: 768px) 100vw, 50vw' className='object-cover' />
          )}
        </div>
        <div className='flex flex-col justify-center'>
          <p className='text-sm font-bold text-[var(--olive-600)]'>{locale === 'en' ? 'Olive oil' : 'زيت زيتون'}</p>
          <h1 className='mt-2 text-4xl font-black text-[var(--olive-950)]'>{product.name}</h1>
          <div className='mt-4 flex flex-wrap gap-2'>
            <span className='rounded-full bg-[var(--olive-100)] px-3 py-1 font-semibold'>{capacityLabel(product.volumeMl, locale)}</span>
            <span className='rounded-full border border-[var(--line)] px-3 py-1'>{packageLabel(product.packaging, locale)}</span>
          </div>
          <p className='mt-5 text-3xl font-extrabold text-[var(--olive-950)]'>{formatEgp(product.pricePiasters, locale)}</p>
          {product.shortDescription && <p className='mt-3 text-lg'>{product.shortDescription}</p>}
          {product.description && <p className='mt-4 whitespace-pre-line text-[var(--muted)]'>{product.description}</p>}
          <AddToCartPanel productId={product.id} locale={locale} />
        </div>
      </section>
    </StorePageShell>
  );
}

