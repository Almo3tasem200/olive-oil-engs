import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getOrderConfirmation } from '@/lib/orders';
import { formatEgp } from '@/lib/money';
import { StorePageShell } from '@/components/store/StorePageShell';
import { capacityLabel } from '@/lib/product-labels';

export async function OrderConfirmationView({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const cookieStore = await cookies();
  const token = cookieStore.get('emo_order_confirmation')?.value;
  const [order, settings] = await Promise.all([
    token ? getOrderConfirmation(token) : Promise.resolve(null),
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <StorePageShell locale={locale} settings={settings}>
      <section className='container-shell max-w-3xl py-14'>
        {order ? (
          <div className='card-surface p-6 sm:p-9'>
            <div className='grid size-14 place-items-center rounded-full bg-[var(--olive-100)] text-2xl font-black text-[var(--olive-950)]' aria-hidden='true'>✓</div>
            <p className='mt-5 text-sm font-bold text-[var(--olive-600)]'>{english ? 'Order received' : 'تم استلام الطلب'}</p>
            <h1 className='mt-1 text-3xl font-black text-[var(--olive-950)]'>{english ? 'Thank you for your order' : 'شكرًا لطلبك'}</h1>
            <p className='mt-3 text-[var(--muted)]'>
              {english ? 'Your order reference is' : 'رقم طلبك هو'} <b dir='ltr'>{order.orderNumber}</b>
            </p>
            <p className='mt-2 text-sm text-[var(--muted)]'>
              {english ? 'The store will confirm the order through its configured contact channel.' : 'سيؤكد المتجر الطلب عبر وسيلة التواصل المعتمدة.'}
            </p>
            <div className='mt-7 divide-y divide-[var(--line)]'>
              {order.items.map((item, index) => (
                <div key={order.orderNumber + '-' + index} className='flex justify-between gap-4 py-3'>
                  <div>
                    <p className='font-bold'>{english ? item.nameEn : item.nameAr}</p>
                    <p className='text-sm text-[var(--muted)]'>{capacityLabel(item.volumeMl, locale)} × {item.quantity}</p>
                  </div>
                  <p className='font-bold'>{formatEgp(item.lineTotalPiasters, locale)}</p>
                </div>
              ))}
            </div>
            <dl className='mt-5 space-y-2'>
              <div className='flex justify-between'><dt>{english ? 'Subtotal' : 'المجموع الفرعي'}</dt><dd>{formatEgp(order.subtotalPiasters, locale)}</dd></div>
              <div className='flex justify-between'><dt>{english ? 'Delivery' : 'التوصيل'}</dt><dd>{formatEgp(order.deliveryPiasters, locale)}</dd></div>
              <div className='flex justify-between border-t border-[var(--line)] pt-3 text-lg font-extrabold'><dt>{english ? 'Total due' : 'الإجمالي المستحق'}</dt><dd>{formatEgp(order.totalPiasters, locale)}</dd></div>
            </dl>
            <p className='mt-5 rounded-xl bg-[var(--olive-100)] p-4 text-sm'>
              {english ? 'Payment method: cash on delivery.' : 'طريقة الدفع: نقدًا عند الاستلام.'}
            </p>
            <Link href={english ? '/en/products' : '/products'} className='btn-secondary mt-6'>
              {english ? 'Continue shopping' : 'متابعة التسوق'}
            </Link>
          </div>
        ) : (
          <div className='card-surface p-8 text-center'>
            <h1 className='text-2xl font-black text-[var(--olive-950)]'>{english ? 'Confirmation is not available' : 'تأكيد الطلب غير متاح'}</h1>
            <p className='mt-3 text-[var(--muted)]'>
              {english ? 'Open this page in the browser where you placed the order, or contact the store with your order reference.' : 'افتح هذه الصفحة من المتصفح الذي أرسلت منه الطلب، أو تواصل مع المتجر برقم الطلب.'}
            </p>
            <Link href={english ? '/en/products' : '/products'} className='btn-primary mt-6'>{english ? 'Browse products' : 'تصفّح المنتجات'}</Link>
          </div>
        )}
      </section>
    </StorePageShell>
  );
}

