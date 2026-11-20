import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CircleHelp, MapPin, ShoppingBasket } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getPublicProducts } from '@/lib/catalog';
import { StorePageShell } from '@/components/store/StorePageShell';
import { ProductCard } from '@/components/store/ProductCard';

export async function HomeView({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const prefix = english ? '/en' : '';
  const [products, settings] = await Promise.all([
    getPublicProducts(locale),
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
  ]);
  const featured = products.slice(0, 3);
  const heroImage = featured[0]?.images[0];

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='overflow-hidden border-b border-[var(--line)] bg-[var(--cream-50)]'>
        <div className='container-shell grid min-h-[520px] items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16'>
          <div>
            <p className='mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--olive-100)] px-4 py-2 text-sm font-bold text-[var(--olive-950)]'>
              {english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}
            </p>
            <h1 className='max-w-2xl text-4xl font-black leading-tight text-[var(--olive-950)] sm:text-5xl'>
              {english ? 'Choose your size and order olive oil easily.' : 'اختار الحجم المناسب واطلب زيت الزيتون بسهولة.'}
            </h1>
            <p className='mt-5 max-w-xl text-lg text-[var(--muted)]'>
              {english
                ? 'Browse the available sizes and review delivery charges before you confirm.'
                : 'تصفّح الأحجام المتاحة وراجع رسوم التوصيل قبل تأكيد الطلب.'}
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link href={prefix + '/products'} className='btn-primary'>
                {english ? 'Shop now' : 'تسوق الآن'}
                {english ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              </Link>
              <Link href={prefix + '/products'} className='btn-secondary'>
                {english ? 'Order now' : 'اطلب الآن'}
              </Link>
            </div>
          </div>
          <div className='relative min-h-72 overflow-hidden rounded-[28px] bg-[var(--olive-100)] md:min-h-[420px]'>
            {heroImage ? (
              <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes='(max-width: 768px) 100vw, 50vw' className='object-cover' />
            ) : (
              <div className='absolute inset-0 grid place-items-center p-8 text-center text-[var(--olive-800)]'>
                <div>
                  <ShoppingBasket className='mx-auto mb-3' size={42} strokeWidth={1.3} aria-hidden='true' />
                  <p className='font-semibold'>
                    {english ? 'Real product photos will appear here after upload.' : 'ستظهر صور المنتجات الحقيقية بعد رفعها من لوحة الإدارة.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className='container-shell grid items-center gap-8 py-14 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' id='about'>
        <div className='relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-full bg-[var(--olive-950)] p-4 shadow-lg'>
          <Image
            src='/reference-assets/brand-logo.jpg'
            alt={english ? 'El Mohandeseen Olive Oil logo' : 'شعار زيت زيتون المهندسين'}
            fill
            sizes='(max-width: 768px) 80vw, 320px'
            className='object-contain p-3'
          />
        </div>
        <div className={english ? 'text-left' : 'text-right'}>
          <p className='text-sm font-bold text-[var(--olive-600)]'>{english ? 'About the company' : 'عن الشركة'}</p>
          <h2 className='mt-1 text-3xl font-extrabold text-[var(--olive-950)]'>{english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}</h2>
          <p className='mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]'>
            {english
              ? 'We are a company dedicated to providing olive oil products.'
              : 'نحن شركة متخصصة في تقديم منتجات زيت الزيتون.'}
          </p>
          <div className='mt-5 flex flex-wrap gap-3'>
            {settings?.whatsapp && <a className='btn-secondary' href={'https://wa.me/' + settings.whatsapp.replace(/\D/g, '')} target='_blank' rel='noreferrer'>{english ? 'Message us on WhatsApp' : 'راسلنا على واتساب'}</a>}
            {settings?.instagramUrl && <a className='btn-secondary' href={settings.instagramUrl} target='_blank' rel='noreferrer'>Instagram</a>}
          </div>
        </div>
      </section>

      <section className='container-shell py-16' id='products'>
        <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='text-sm font-bold text-[var(--olive-600)]'>{english ? 'Catalog' : 'الكتالوج'}</p>
            <h2 className='mt-1 text-3xl font-extrabold text-[var(--olive-950)]'>{english ? 'Available sizes' : 'الأحجام المتاحة'}</h2>
          </div>
          <Link href={prefix + '/products'} className='font-bold text-[var(--olive-800)] underline underline-offset-4'>
            {english ? 'View all products' : 'عرض كل المنتجات'}
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
                ? 'The products are being prepared for publication. The owner will publish them after uploading the actual package photos.'
                : 'المنتجات قيد التجهيز للنشر. ستظهر بعد رفع صور العبوات الحقيقية واعتمادها من الإدارة.'}
            </p>
          </div>
        )}
      </section>

      <section className='bg-white py-16'>
        <div className='container-shell grid gap-10 md:grid-cols-2'>
          <div>
            <p className='text-sm font-bold text-[var(--olive-600)]'>{english ? 'Ordering' : 'الطلب'}</p>
            <h2 className='mt-1 text-3xl font-extrabold text-[var(--olive-950)]'>{english ? 'A clear order, step by step' : 'اطلب بخطوات واضحة'}</h2>
            <div id='how-to-order' className='mt-6 grid gap-4 sm:grid-cols-2'>
              {[
                english ? ['01', 'Choose a size'] : ['٠١', 'اختار الحجم'],
                english ? ['02', 'Enter delivery details'] : ['٠٢', 'اكتب بيانات التوصيل'],
                english ? ['03', 'Review the full total'] : ['٠٣', 'راجع الإجمالي'],
                english ? ['04', 'Confirm the order'] : ['٠٤', 'أكد الطلب'],
              ].map(([number, label]) => (
                <div key={number} className='rounded-2xl border border-[var(--line)] p-4'>
                  <span className='text-sm font-extrabold text-[var(--gold-500)]'>{number}</span>
                  <p className='mt-1 font-bold'>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className='rounded-3xl bg-[var(--cream-50)] p-7'>
            <div className='flex items-center gap-3'>
              <MapPin className='text-[var(--olive-800)]' aria-hidden='true' />
              <h2 className='text-2xl font-extrabold text-[var(--olive-950)]'>{english ? 'Delivery' : 'التوصيل'}</h2>
            </div>
            <p className='mt-4 text-[var(--muted)]'>
              {english
                ? (settings?.deliveryPolicyEn || 'Delivery areas and charges are shown from the store’s current settings before order confirmation.')
                : (settings?.deliveryPolicyAr || 'تظهر مناطق التوصيل والرسوم المعتمدة من المتجر قبل تأكيد الطلب.')}
            </p>
            <Link href={prefix + '/delivery'} className='mt-5 inline-flex items-center gap-2 font-bold text-[var(--olive-800)] underline underline-offset-4'>
              {english ? 'Delivery details' : 'تفاصيل التوصيل'}
            </Link>
          </div>
        </div>
      </section>

      <section className='container-shell py-16'>
        <div className='mb-7 flex items-center gap-3'>
          <CircleHelp className='text-[var(--olive-800)]' aria-hidden='true' />
          <h2 className='text-3xl font-extrabold text-[var(--olive-950)]'>{english ? 'Frequently asked questions' : 'الأسئلة الشائعة'}</h2>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          {(english
            ? [
                ['Do I need an account?', 'No. Check out as a guest, or create an account to see orders placed while signed in.'],
                ['When will I see the delivery fee?', 'Choose a supported area to see the configured fee before confirming.'],
                ['How can I pay?', settings?.codEnabled ? 'Cash on delivery is currently available.' : 'Payment options are shown at checkout when enabled by the store.'],
              ]
            : [
                ['هل أحتاج إلى إنشاء حساب؟', 'لا، يمكنك الطلب كضيف.'],
                ['متى تظهر رسوم التوصيل؟', 'اختر منطقة متاحة لتظهر الرسوم المعتمدة قبل التأكيد.'],
                ['كيف يمكنني الدفع؟', settings?.codEnabled ? 'الدفع عند الاستلام متاح حاليًا.' : 'تظهر طرق الدفع في صفحة الطلب عند تفعيلها من المتجر.'],
              ]).map(([question, answer]) => (
                <article key={question} className='card-surface p-5'>
                  <h3 className='font-bold text-[var(--olive-950)]'>{question}</h3>
                  <p className='mt-2 text-sm text-[var(--muted)]'>{answer}</p>
                </article>
              ))}
        </div>
      </section>

      <section className='bg-[var(--olive-950)] py-12 text-white'>
        <div className='container-shell flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center'>
          <div>
            <h2 className='text-2xl font-extrabold'>{english ? 'Choose your preferred size' : 'اختار الحجم المناسب لك'}</h2>
            <p className='mt-2 text-white/75'>{english ? 'Review the delivery fee before you place the order.' : 'راجع رسوم التوصيل قبل إرسال الطلب.'}</p>
          </div>
          <Link href={prefix + '/products'} className='inline-flex min-h-11 items-center rounded-xl bg-white px-5 font-bold text-[var(--olive-950)]'>
            {english ? 'Browse products' : 'تصفّح المنتجات'}
          </Link>
        </div>
      </section>
    </StorePageShell>
  );
}

