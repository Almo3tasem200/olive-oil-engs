import { getPublicProducts } from '@/backend/catalog';
import { prisma } from '@/backend/db';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';
import { ProductCard } from '@/frontend/components/store/ProductCard';

export async function ProductListView({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const [products, settings] = await Promise.all([
    getPublicProducts(locale),
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell py-12 md:py-16'>
        <p className='text-sm font-bold text-[var(--olive-600)]'>{english ? 'Catalog' : 'الكتالوج'}</p>
        <h1 className='mt-1 text-4xl font-black text-[var(--olive-950)]'>{english ? 'Olive oil sizes' : 'أحجام زيت الزيتون'}</h1>
        <p className='mt-3 max-w-2xl text-[var(--muted)]'>
          {english ? 'Compare the available package sizes and current prices.' : 'قارن بين الأحجام المتاحة والأسعار الحالية.'}
        </p>
        {products.length ? (
          <div className='mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
          </div>
        ) : (
          <div className='card-surface mt-8 p-8 text-center text-[var(--muted)]'>
            {english
              ? 'Products will appear here after the owner approves their photos and publishes them.'
              : 'ستظهر المنتجات هنا بعد اعتماد صورها ونشرها من الإدارة.'}
          </div>
        )}
      </section>
    </StorePageShell>
  );
}

