import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CircleHelp, MapPin, ShoppingBag } from 'lucide-react';
import { prisma } from '@/backend/db';
import { formatDeliveryFee } from '@/shared/money';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';

type Locale = 'ar' | 'en';

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className='mb-9 max-w-3xl'>
      <p className='text-sm font-bold text-[var(--olive-600)]'>{eyebrow}</p>
      <h1 className='mt-2 text-3xl font-black text-[var(--olive-950)] sm:text-4xl'>{title}</h1>
      <p className='mt-3 leading-7 text-[var(--muted)]'>{description}</p>
    </header>
  );
}

export async function AboutView({ locale = 'ar' }: { locale?: Locale }) {
  const english = locale === 'en';
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  const prefix = english ? '/en' : '';
  const contactHref = settings?.whatsapp
    ? 'https://wa.me/' + settings.whatsapp.replace(/\D/g, '')
    : settings?.phone ? 'tel:' + settings.phone : null;

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell py-12 md:py-16'>
        <PageIntro
          eyebrow={english ? 'About the store' : 'عن المتجر'}
          title={english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}
          description={english
            ? 'A simple place to review the store’s olive oil sizes, product details, and current prices before ordering.'
            : 'مساحة بسيطة للتعرّف على أحجام زيت الزيتون المتاحة وبيانات المنتجات وأسعارها الحالية قبل الطلب.'}
        />
        <div className='grid items-center gap-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 md:grid-cols-[minmax(220px,0.7fr)_1.3fr]'>
          <div className='relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-full bg-[var(--brand-panel-bg)] p-4'>
            <Image src='/reference-assets/brand-logo.jpg' alt={english ? 'El Mohandeseen Olive Oil logo' : 'شعار زيت زيتون المهندسين'} fill sizes='(max-width: 768px) 70vw, 260px' className='object-contain p-3' />
          </div>
          <div>
            <h2 className='text-2xl font-extrabold text-[var(--olive-950)]'>{english ? 'Clear product information' : 'بيانات واضحة لكل منتج'}</h2>
            <p className='mt-3 leading-8 text-[var(--muted)]'>
              {english
                ? 'Each published product has its own size, package information, image, availability, and owner-managed price. Review the delivery details and final total before confirming an order.'
                : 'لكل منتج منشور حجم وبيانات عبوة وصورة وحالة توفر وسعر يديره صاحب المتجر. راجع تفاصيل التوصيل والإجمالي النهائي قبل تأكيد الطلب.'}
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <Link href={prefix + '/products'} className='btn-primary'>{english ? 'Browse products' : 'تصفح المنتجات'}</Link>
              {contactHref && (
                <a className='btn-secondary' href={contactHref} target={settings?.whatsapp ? '_blank' : undefined} rel={settings?.whatsapp ? 'noreferrer' : undefined}>
                  {english ? 'Contact the store' : 'تواصل مع المتجر'}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </StorePageShell>
  );
}

export async function HowToOrderView({ locale = 'ar' }: { locale?: Locale }) {
  const english = locale === 'en';
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  const prefix = english ? '/en' : '';
  const steps = english
    ? [
        ['01', 'Choose a product', 'Review each size, its product details, availability, and current price.'],
        ['02', 'Add it to your cart', 'Choose the quantity you want, then review your cart before checkout.'],
        ['03', 'Enter delivery details', 'Provide your contact and address details, then choose an available delivery area.'],
        ['04', 'Review and confirm', 'Check the item subtotal, delivery fee, and full total before sending the order.'],
      ]
    : [
        ['٠١', 'اختر المنتج', 'راجع الحجم وبيانات المنتج وحالة التوفر والسعر الحالي.'],
        ['٠٢', 'أضفه إلى السلة', 'حدد الكمية المطلوبة ثم راجع السلة قبل إتمام الطلب.'],
        ['٠٣', 'أدخل بيانات التوصيل', 'أدخل بيانات التواصل والعنوان، ثم اختر منطقة توصيل متاحة.'],
        ['٠٤', 'راجع وأكد الطلب', 'تحقق من قيمة المنتجات ورسوم التوصيل والإجمالي قبل إرسال الطلب.'],
      ];

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell py-12 md:py-16'>
        <PageIntro
          eyebrow={english ? 'Ordering guide' : 'دليل الطلب'}
          title={english ? 'How to place an order' : 'طريقة الطلب'}
          description={english
            ? 'Follow these steps to place an order and see the full cost before confirming.'
            : 'اتبع الخطوات التالية لإرسال طلبك ومعرفة التكلفة كاملة قبل التأكيد.'}
        />
        <ol className='grid gap-4 md:grid-cols-2'>
          {steps.map(([number, title, description]) => (
            <li key={number} className='card-surface flex gap-4 p-5 sm:p-6'>
              <span className='grid size-11 shrink-0 place-items-center rounded-full bg-[var(--olive-100)] font-extrabold text-[var(--olive-800)]'>{number}</span>
              <div>
                <h2 className='font-extrabold text-[var(--olive-950)]'>{title}</h2>
                <p className='mt-2 text-sm leading-7 text-[var(--muted)]'>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className='mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--olive-100)] p-5'>
          <p className='text-sm leading-7 text-[var(--olive-950)]'>
            {english
              ? (settings?.codEnabled ? 'Cash on delivery is enabled. The available payment method is shown again during checkout.' : 'Available payment methods are shown at checkout when the store enables them.')
              : (settings?.codEnabled ? 'الدفع عند الاستلام متاح، وستظهر طريقة الدفع مرة أخرى أثناء إتمام الطلب.' : 'تظهر طرق الدفع أثناء إتمام الطلب عند تفعيلها من المتجر.')}
          </p>
          <Link href={prefix + '/delivery'} className='inline-flex items-center gap-2 font-bold text-[var(--olive-800)] underline underline-offset-4'>
            {english ? 'Review delivery information' : 'راجع تفاصيل التوصيل'}
            {english ? <ArrowRight size={17} /> : <ArrowLeft size={17} />}
          </Link>
        </div>
        <div className='mt-8'>
          <Link href={prefix + '/products'} className='btn-primary'>
            <ShoppingBag size={18} aria-hidden='true' />
            {english ? 'Start shopping' : 'ابدأ التسوق'}
          </Link>
        </div>
      </section>
    </StorePageShell>
  );
}

export async function FaqView({ locale = 'ar' }: { locale?: Locale }) {
  const english = locale === 'en';
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  const prefix = english ? '/en' : '';
  const entries: [string, string, string | null][] = english
    ? [
        ['Do I need an account to order?', 'Yes. Sign in or create an account to complete checkout.', null],
        ['How do I know the delivery fee?', 'Choose an available area at checkout to see its configured fee before confirming.', prefix + '/delivery'],
        ['What payment methods are available?', settings?.codEnabled ? 'Cash on delivery is currently enabled. The checkout page shows the available method.' : 'Payment options are shown at checkout when enabled by the store.', null],
        ['Where can I see my order?', 'Orders appear in the account used to place them.', prefix + '/account'],
        ['I forgot my password. What should I do?', 'Use the password recovery page to request a verification code by email, if email recovery has been configured for the store.', prefix + '/account/forgot-password'],
      ]
    : [
        ['هل أحتاج إلى حساب لإرسال طلب؟', 'نعم، سجّل الدخول أو أنشئ حسابًا لإتمام الطلب.', null],
        ['كيف أعرف رسوم التوصيل؟', 'اختر منطقة متاحة أثناء إتمام الطلب لتظهر الرسوم المعتمدة قبل التأكيد.', prefix + '/delivery'],
        ['ما طرق الدفع المتاحة؟', settings?.codEnabled ? 'الدفع عند الاستلام متاح حاليًا، وستظهر الطريقة المتاحة في صفحة إتمام الطلب.' : 'تظهر طرق الدفع في صفحة إتمام الطلب عند تفعيلها من المتجر.', null],
        ['أين أجد طلبي؟', 'يظهر الطلب في الحساب الذي استخدمته لإرساله.', prefix + '/account'],
        ['نسيت كلمة المرور، ماذا أفعل؟', 'استخدم صفحة استعادة كلمة المرور لطلب رمز تحقق عبر البريد إذا كانت خدمة الاستعادة مفعلة للمتجر.', prefix + '/account/forgot-password'],
      ];

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell py-12 md:py-16'>
        <PageIntro
          eyebrow={english ? 'Help center' : 'مركز المساعدة'}
          title={english ? 'Frequently asked questions' : 'الأسئلة الشائعة'}
          description={english ? 'Quick answers about accounts, ordering, delivery, and payment.' : 'إجابات سريعة عن الحسابات والطلبات والتوصيل والدفع.'}
        />
        <div className='grid gap-4 md:grid-cols-2'>
          {entries.map(([question, answer, href]) => (
            <article key={question} className='card-surface p-5 sm:p-6'>
              <div className='flex items-start gap-3'>
                <CircleHelp size={20} className='mt-0.5 shrink-0 text-[var(--olive-800)]' aria-hidden='true' />
                <div>
                  <h2 className='font-extrabold text-[var(--olive-950)]'>{question}</h2>
                  <p className='mt-2 text-sm leading-7 text-[var(--muted)]'>{answer}</p>
                  {href && <Link href={href} className='mt-3 inline-block text-sm font-bold text-[var(--olive-800)] underline underline-offset-4'>{english ? 'Learn more' : 'اعرف المزيد'}</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </StorePageShell>
  );
}

export async function DeliveryView({ locale = 'ar' }: { locale?: Locale }) {
  const english = locale === 'en';
  const [settings, zones] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: english
      ? [{ governorateEn: 'asc' }, { cityEn: 'asc' }, { areaEn: 'asc' }]
      : [{ governorateAr: 'asc' }, { cityAr: 'asc' }, { areaAr: 'asc' }] }),
  ]);
  const deliveryPolicy = english ? settings?.deliveryPolicyEn : settings?.deliveryPolicyAr;

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell py-12 md:py-16'>
        <PageIntro
          eyebrow={english ? 'Before you order' : 'قبل الطلب'}
          title={english ? 'Delivery information' : 'معلومات التوصيل'}
          description={english
            ? 'Check the published delivery areas and fees. The final delivery charge is confirmed at checkout.'
            : 'راجع مناطق التوصيل والرسوم المنشورة. يتم تأكيد رسوم التوصيل النهائية أثناء إتمام الطلب.'}
        />
        {deliveryPolicy && (
          <p className='mb-6 max-w-3xl whitespace-pre-line leading-7 text-[var(--muted)]'>
            {deliveryPolicy}
          </p>
        )}
        {zones.length ? (
          <div className='overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]'>
            <table className={'w-full min-w-[520px] ' + (english ? 'text-left' : 'text-right')}>
              <thead className='bg-[var(--olive-100)] text-[var(--olive-950)]'>
                <tr>
                  <th scope='col' className='p-3'>{english ? 'Governorate / city' : 'المحافظة / المدينة'}</th>
                  <th scope='col' className='p-3'>{english ? 'Area' : 'المنطقة'}</th>
                  <th scope='col' className='p-3'>{english ? 'Delivery fee' : 'رسوم التوصيل'}</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className='border-t border-[var(--line)]'>
                    <td className='p-3'>{english ? zone.governorateEn : zone.governorateAr} · {english ? zone.cityEn : zone.cityAr}</td>
                    <td className='p-3'>{english ? zone.areaEn : zone.areaAr}</td>
                    <td className='p-3 font-bold'>{formatDeliveryFee(zone.feePiasters, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950'>
            <MapPin className='mt-0.5 shrink-0' size={20} aria-hidden='true' />
            <p>{english ? 'Delivery areas and fees have not been published yet. Please check again later or contact the store.' : 'لم تُنشر مناطق التوصيل ورسومها بعد. يرجى العودة لاحقًا أو التواصل مع المتجر.'}</p>
          </div>
        )}
      </section>
    </StorePageShell>
  );
}
