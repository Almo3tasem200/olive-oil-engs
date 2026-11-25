import Link from 'next/link';
import { ArrowLeft, ArrowRight, Leaf } from 'lucide-react';
import { prisma } from '@/backend/db';
import { getPublicProducts } from '@/backend/catalog';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';
import { ProductCard } from '@/frontend/components/store/ProductCard';

export async function HomeView({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const prefix = english ? '/en' : '';
  const [products, settings] = await Promise.all([
    getPublicProducts(locale),
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
  ]);
  const featured = products.slice(0, 3);

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section id='store-hero' dir={english ? 'ltr' : 'rtl'} className='border-b border-[var(--line)] bg-[var(--cream-50)]'>
        <div className='container-shell py-10 md:py-14'>
          <aside id='olive-oil-benefits' className='card-surface mx-auto mb-10 max-w-5xl p-5 sm:p-7'>
            <div className='mb-5 flex items-center justify-center gap-2 text-[var(--olive-800)]'>
              <Leaf size={20} aria-hidden='true' />
              <h2 className='text-xl font-extrabold'>{english ? 'Why choose olive oil?' : 'ما فوائد زيت الزيتون؟'}</h2>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <article className='rounded-2xl bg-[var(--olive-100)] p-5'>
                <h3 className='font-bold text-[var(--olive-950)]'>{english ? 'A source of unsaturated fats' : 'مصدر للدهون غير المشبعة'}</h3>
                <p className='mt-2 text-sm leading-7 text-[var(--muted)]'>
                  {english
                    ? 'Olive oil is rich in monounsaturated fats. Using unsaturated fats in place of saturated fats may help improve cholesterol as part of a balanced eating pattern.'
                    : 'زيت الزيتون غني بالدهون الأحادية غير المشبعة. واستخدام الدهون غير المشبعة بدلًا من الدهون المشبعة قد يساعد على تحسين مستويات الكوليسترول ضمن نظام غذائي متوازن.'}
                </p>
              </article>
              <article className='rounded-2xl bg-[var(--olive-100)] p-5'>
                <h3 className='font-bold text-[var(--olive-950)]'>{english ? 'Easy to enjoy every day' : 'سهل الإضافة إلى وجباتك'}</h3>
                <p className='mt-2 text-sm leading-7 text-[var(--muted)]'>
                  {english
                    ? 'Add it to salads or use it in everyday cooking as a flavorful plant-based oil.'
                    : 'أضفه إلى السلطات أو استخدمه في الطهي اليومي كزيت نباتي غني بالنكهة.'}
                </p>
              </article>
            </div>
            <p className='mt-4 text-center text-xs text-[var(--muted)]'>
              {english ? 'Nutrition guidance: ' : 'للاطلاع على الإرشادات الغذائية: '}
              <a className='font-bold text-[var(--olive-800)] underline underline-offset-2' href='https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/fats-in-foods' target='_blank' rel='noreferrer'>
                {english ? 'American Heart Association' : 'جمعية القلب الأمريكية'}
              </a>
            </p>
          </aside>

          <div className='mx-auto max-w-3xl text-center'>
            <p className='mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--olive-100)] px-4 py-2 text-sm font-bold text-[var(--olive-950)]'>
              {english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}
            </p>
            <h1 className='text-4xl font-black leading-tight text-[var(--olive-950)] sm:text-5xl'>
              {english ? 'Choose your size and order olive oil easily.' : 'اختار الحجم المناسب واطلب زيت الزيتون بسهولة.'}
            </h1>
            <p className='mx-auto mt-5 max-w-2xl text-lg text-[var(--muted)]'>
              {english
                ? 'Browse the available sizes and review delivery charges before you confirm.'
                : 'تصفح الأحجام المتاحة وراجع رسوم التوصيل قبل تأكيد الطلب.'}
            </p>
            <div className='mt-8 flex justify-center'>
              <Link href={prefix + '/products'} className='btn-primary'>
                {english ? 'Browse products' : 'تصفح المنتجات'}
                {english ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='container-shell py-14 md:py-16' id='products'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='text-sm font-bold text-[var(--olive-600)]'>{english ? 'Shop' : 'تسوق'}</p>
            <h2 className='mt-1 text-3xl font-extrabold text-[var(--olive-950)]'>{english ? 'Featured sizes' : 'أحجام مختارة'}</h2>
          </div>
          <Link href={prefix + '/products'} className='font-bold text-[var(--olive-800)] underline underline-offset-4'>
            {english ? 'See the full catalog' : 'انتقل إلى الكتالوج الكامل'}
          </Link>
        </div>
        {featured.length ? (
          <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {featured.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
          </div>
        ) : (
          <div className='card-surface grid min-h-40 place-items-center p-8 text-center'>
            <p className='max-w-xl text-[var(--muted)]'>
              {english
                ? 'The catalog is being prepared. Products will appear here once their photos and details are approved.'
                : 'يجري تجهيز الكتالوج. ستظهر المنتجات بعد اعتماد صورها وبياناتها.'}
            </p>
          </div>
        )}
      </section>
    </StorePageShell>
  );
}
