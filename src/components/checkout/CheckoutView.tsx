'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import type { StoreProduct } from '@/components/store/ProductCard';
import { formatEgp } from '@/lib/money';
import { capacityLabel } from '@/lib/product-labels';

type Zone = {
  id: string;
  governorateAr: string;
  governorateEn: string;
  cityAr: string;
  cityEn: string;
  areaAr: string;
  areaEn: string;
  feePiasters: number;
  freeDeliveryOverPiasters: number | null;
};

type Quote = {
  subtotalPiasters: number;
  deliveryPiasters: number | null;
  totalPiasters: number | null;
  items: { productId: string; nameAr: string; nameEn: string; volumeMl: number; unitPricePiasters: number; quantity: number; lineTotalPiasters: number }[];
};

type FormFields = {
  customerName: string;
  phone: string;
  governorate: string;
  city: string;
  area: string;
  deliveryZoneId: string;
  address: string;
  buildingNumber: string;
  floorApartment: string;
  landmark: string;
  customerNotes: string;
  contactPreference: '' | 'PHONE' | 'WHATSAPP';
};

const initialFields: FormFields = {
  customerName: '',
  phone: '',
  governorate: '',
  city: '',
  area: '',
  deliveryZoneId: '',
  address: '',
  buildingNumber: '',
  floorApartment: '',
  landmark: '',
  customerNotes: '',
  contactPreference: '',
};

export function CheckoutView({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const prefix = english ? '/en' : '';
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [codEnabled, setCodEnabled] = useState(false);
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [quoteResult, setQuoteResult] = useState<{ requestKey: string; quote: Quote } | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/catalog/products?locale=' + locale, { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/delivery-zones', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/storefront/settings', { cache: 'no-store' }).then((response) => response.json()),
    ]).then(([catalog, delivery, store]) => {
      if (!active) return;
      setProducts(catalog.products as StoreProduct[]);
      setZones(delivery.zones as Zone[]);
      setCodEnabled(Boolean(store.settings?.codEnabled));
    }).catch(() => {
      if (active) setError(english ? 'Could not load checkout options.' : 'تعذر تحميل خيارات الطلب.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [locale, english]);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const validItems = useMemo(() => items.filter((item) => productById.has(item.productId)), [items, productById]);
  const quoteRequestKey = useMemo(() => JSON.stringify({
    zoneId: fields.deliveryZoneId,
    items: validItems.map((item) => [item.productId, item.quantity]),
  }), [fields.deliveryZoneId, validItems]);
  const quote = quoteResult?.requestKey === quoteRequestKey ? quoteResult.quote : null;

  useEffect(() => {
    if (!ready || !products.length || !fields.deliveryZoneId || !validItems.length) {
      return;
    }
    let active = true;
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: validItems,
        deliveryZoneId: fields.deliveryZoneId,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not calculate total.');
        return data as Quote;
      })
      .then((data) => { if (active) setQuoteResult({ requestKey: quoteRequestKey, quote: data }); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not calculate total.'); });
    return () => { active = false; };
  }, [ready, products.length, fields.deliveryZoneId, validItems, quoteRequestKey]);

  const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  function onZoneChange(zoneId: string) {
    const zone = zones.find((entry) => entry.id === zoneId);
    setFields((current) => ({
      ...current,
      deliveryZoneId: zoneId,
      governorate: zone ? (english ? zone.governorateEn : zone.governorateAr) : '',
      city: zone ? (english ? zone.cityEn : zone.cityAr) : '',
      area: zone ? (english ? zone.areaEn : zone.areaAr) : '',
    }));
  }

  function continueToReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!event.currentTarget.reportValidity()) return;
    if (!validItems.length || validItems.length !== items.length) {
      setError(english ? 'Remove unavailable products from the cart.' : 'احذف المنتجات غير المتاحة من السلة.');
      return;
    }
    if (!fields.deliveryZoneId || !quote) {
      setError(english ? 'Choose an available delivery area and wait for the total.' : 'اختر منطقة توصيل متاحة وانتظر حساب الإجمالي.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitOrder() {
    setBusy(true);
    setError('');
    try {
      let key = sessionStorage.getItem('emo-checkout-key');
      if (!key) {
        key = crypto.randomUUID();
        sessionStorage.setItem('emo-checkout-key', key);
      }
      const response = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems,
          customerName: fields.customerName,
          phone: fields.phone,
          governorate: fields.governorate,
          city: fields.city,
          area: fields.area,
          deliveryZoneId: fields.deliveryZoneId,
          address: fields.address,
          buildingNumber: fields.buildingNumber,
          floorApartment: fields.floorApartment,
          landmark: fields.landmark,
          customerNotes: fields.customerNotes,
          contactPreference: fields.contactPreference || undefined,
          idempotencyKey: key,
          expectedSubtotalPiasters: quote?.subtotalPiasters,
          expectedDeliveryPiasters: quote?.deliveryPiasters,
          expectedTotalPiasters: quote?.totalPiasters,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.currentQuote) setQuoteResult({ requestKey: quoteRequestKey, quote: result.currentQuote as Quote });
        throw new Error(result.error || (english ? 'Could not place the order.' : 'تعذر إرسال الطلب.'));
      }
      sessionStorage.removeItem('emo-checkout-key');
      clear();
      router.push(prefix + '/order-confirmation?locale=' + locale);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? 'Could not place the order.' : 'تعذر إرسال الطلب.'));
      setBusy(false);
    }
  }

  if (!ready || loading) {
    return <section className='container-shell py-12'>{english ? 'Loading checkout…' : 'جارٍ تحميل الطلب…'}</section>;
  }

  if (!items.length) {
    return (
      <section className='container-shell py-12'>
        <h1 className='text-3xl font-black'>{english ? 'Your cart is empty' : 'السلة فارغة'}</h1>
        <Link className='btn-primary mt-5' href={prefix + '/products'}>{english ? 'Browse products' : 'تصفّح المنتجات'}</Link>
      </section>
    );
  }

  return (
    <section className='container-shell py-10 md:py-14'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-3xl font-black text-[var(--olive-950)]'>{english ? 'Checkout' : 'إتمام الطلب'}</h1>
        <span className='text-sm font-semibold text-[var(--muted)]'>{english ? 'Step ' + step + ' of 2' : 'الخطوة ' + step + ' من ٢'}</span>
      </div>

      {!zones.length && !loading && (
        <div className='mt-5 rounded-xl bg-amber-50 p-4 text-amber-900'>
          {english ? 'Delivery areas are not configured yet. Please contact the store after it publishes its delivery policy.' : 'لم تُحدد مناطق التوصيل بعد. يرجى التواصل مع المتجر بعد إعلان سياسة التوصيل.'}
        </div>
      )}
      {!codEnabled && (
        <div className='mt-4 rounded-xl bg-amber-50 p-4 text-amber-900'>
          {english ? 'Cash on delivery is currently disabled by the store.' : 'الدفع عند الاستلام غير مفعّل حاليًا من المتجر.'}
        </div>
      )}

      <form className='mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]' onSubmit={continueToReview}>
        <div className='card-surface p-5 sm:p-7'>
          {step === 1 ? (
            <>
              <h2 className='text-xl font-extrabold'>{english ? 'Delivery details' : 'بيانات التوصيل'}</h2>
              <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                <label>
                  <span className='field-label'>{english ? 'Full name' : 'الاسم بالكامل'} *</span>
                  <input className='field-control' required maxLength={160} autoComplete='name' value={fields.customerName} onChange={(event) => setField('customerName', event.target.value)} />
                </label>
                <label>
                  <span className='field-label'>{english ? 'Mobile number' : 'رقم الموبايل'} *</span>
                  <input className='field-control' required inputMode='tel' autoComplete='tel' maxLength={32} value={fields.phone} onChange={(event) => setField('phone', event.target.value)} dir='ltr' />
                </label>
                <label className='sm:col-span-2'>
                  <span className='field-label'>{english ? 'Delivery area' : 'منطقة التوصيل'} *</span>
                  <select className='field-control' required value={fields.deliveryZoneId} onChange={(event) => onZoneChange(event.target.value)}>
                    <option value=''>{english ? 'Choose an available area' : 'اختر منطقة متاحة'}</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {(english ? zone.governorateEn + ' · ' + zone.cityEn + ' · ' + zone.areaEn : zone.governorateAr + ' · ' + zone.cityAr + ' · ' + zone.areaAr) + ' — ' + formatEgp(zone.feePiasters, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className='sm:col-span-2'>
                  <span className='field-label'>{english ? 'Full address' : 'العنوان بالكامل'} *</span>
                  <input className='field-control' required maxLength={500} autoComplete='street-address' value={fields.address} onChange={(event) => setField('address', event.target.value)} />
                </label>
                <label>
                  <span className='field-label'>{english ? 'Building number' : 'رقم المبنى'} *</span>
                  <input className='field-control' required maxLength={80} value={fields.buildingNumber} onChange={(event) => setField('buildingNumber', event.target.value)} />
                </label>
                <label>
                  <span className='field-label'>{english ? 'Floor / apartment (optional)' : 'الدور / الشقة (اختياري)'}</span>
                  <input className='field-control' maxLength={80} value={fields.floorApartment} onChange={(event) => setField('floorApartment', event.target.value)} />
                </label>
                <label className='sm:col-span-2'>
                  <span className='field-label'>{english ? 'Nearby landmark' : 'علامة مميزة قريبة'} *</span>
                  <input className='field-control' required maxLength={200} value={fields.landmark} onChange={(event) => setField('landmark', event.target.value)} />
                </label>
                <label>
                  <span className='field-label'>{english ? 'Contact preference' : 'طريقة التواصل المفضلة'}</span>
                  <select className='field-control' value={fields.contactPreference} onChange={(event) => setField('contactPreference', event.target.value as FormFields['contactPreference'])}>
                    <option value=''>{english ? 'No preference' : 'بدون تفضيل'}</option>
                    <option value='PHONE'>{english ? 'Phone call' : 'مكالمة هاتفية'}</option>
                    <option value='WHATSAPP'>WhatsApp</option>
                  </select>
                </label>
                <label className='sm:col-span-2'>
                  <span className='field-label'>{english ? 'Order notes (optional)' : 'ملاحظات الطلب (اختياري)'}</span>
                  <textarea className='field-control min-h-24' maxLength={1000} value={fields.customerNotes} onChange={(event) => setField('customerNotes', event.target.value)} />
                </label>
              </div>
              <div className='mt-6 flex flex-col justify-between gap-3 sm:flex-row'>
                <Link href={prefix + '/cart'} className='btn-secondary'>{english ? 'Back to cart' : 'العودة إلى السلة'}</Link>
                <button className='btn-primary' type='submit' disabled={!codEnabled || !zones.length || !quote}>
                  {english ? 'Review order' : 'مراجعة الطلب'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className='text-xl font-extrabold'>{english ? 'Review before confirming' : 'راجع طلبك قبل التأكيد'}</h2>
              <div className='mt-4 space-y-3'>
                {quote?.items.map((item) => (
                  <div key={item.productId} className='flex justify-between gap-4 border-b border-[var(--line)] py-3'>
                    <div>
                      <p className='font-bold'>{english ? item.nameEn : item.nameAr}</p>
                      <p className='text-sm text-[var(--muted)]'>{capacityLabel(item.volumeMl, locale)} × {item.quantity}</p>
                    </div>
                    <p className='font-bold'>{formatEgp(item.lineTotalPiasters, locale)}</p>
                  </div>
                ))}
              </div>
              <dl className='mt-5 space-y-2'>
                <div className='flex justify-between gap-4'><dt>{english ? 'Subtotal' : 'المجموع الفرعي'}</dt><dd className='font-semibold'>{quote ? formatEgp(quote.subtotalPiasters, locale) : '—'}</dd></div>
                <div className='flex justify-between gap-4'><dt>{english ? 'Delivery' : 'التوصيل'}</dt><dd className='font-semibold'>{quote?.deliveryPiasters !== null && quote?.deliveryPiasters !== undefined ? formatEgp(quote.deliveryPiasters, locale) : '—'}</dd></div>
                <div className='flex justify-between gap-4 border-t border-[var(--line)] pt-3 text-lg font-extrabold'><dt>{english ? 'Total due' : 'الإجمالي المستحق'}</dt><dd>{quote?.totalPiasters !== null && quote?.totalPiasters !== undefined ? formatEgp(quote.totalPiasters, locale) : '—'}</dd></div>
              </dl>
              <div className='mt-5 rounded-xl bg-[var(--olive-100)] p-4 text-sm'>
                <p className='font-bold'>{english ? 'Delivery details' : 'بيانات التوصيل'}</p>
                <p className='mt-1'>{fields.customerName} · {fields.phone}</p>
                <p>{fields.governorate} · {fields.city} · {fields.area}</p>
                <p>{fields.address} · {english ? 'Building ' : 'مبنى '} {fields.buildingNumber}{fields.floorApartment ? ' · ' + fields.floorApartment : ''}</p>
              </div>
              <div className='mt-6 flex flex-col justify-between gap-3 sm:flex-row'>
                <button type='button' className='btn-secondary' onClick={() => setStep(1)}>{english ? 'Edit details' : 'تعديل البيانات'}</button>
                <button type='button' className='btn-primary' onClick={submitOrder} disabled={busy || !quote || !codEnabled}>
                  {busy ? (english ? 'Sending…' : 'جارٍ الإرسال…') : (english ? 'Confirm order' : 'تأكيد الطلب')}
                </button>
              </div>
            </>
          )}
          {error && <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
        </div>
        <aside className='card-surface p-5 lg:sticky lg:top-24'>
          <h2 className='text-lg font-extrabold'>{english ? 'Order summary' : 'ملخص الطلب'}</h2>
          <p className='mt-2 text-sm text-[var(--muted)]'>{english ? items.length + ' different product(s) in cart' : 'عدد المنتجات المختلفة في السلة: ' + items.length}</p>
          {quote && (
            <div className='mt-4 space-y-2 text-sm'>
              <div className='flex justify-between gap-3'><span>{english ? 'Subtotal' : 'المجموع الفرعي'}</span><span>{formatEgp(quote.subtotalPiasters, locale)}</span></div>
              <div className='flex justify-between gap-3'><span>{english ? 'Delivery' : 'التوصيل'}</span><span>{quote.deliveryPiasters === null ? '—' : formatEgp(quote.deliveryPiasters, locale)}</span></div>
              <div className='flex justify-between gap-3 border-t border-[var(--line)] pt-3 font-extrabold'><span>{english ? 'Total' : 'الإجمالي'}</span><span>{quote.totalPiasters === null ? '—' : formatEgp(quote.totalPiasters, locale)}</span></div>
            </div>
          )}
          <p className='mt-4 text-xs text-[var(--muted)]'>
            {english ? 'The server verifies product prices and availability again when you submit.' : 'يتحقق النظام من الأسعار والتوافر مرة أخرى عند إرسال الطلب.'}
          </p>
        </aside>
      </form>
    </section>
  );
}

