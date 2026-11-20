'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatEgp } from '@/lib/money';
import { capacityLabel, packageLabel } from '@/components/store/ProductCard';

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  contactPreference: string | null;
  governorate: string;
  city: string;
  area: string;
  address: string;
  buildingNumber: string;
  floorApartment: string | null;
  landmark: string;
  customerNotes: string | null;
  deliveryZoneLabel: string;
  subtotalPiasters: number;
  deliveryPiasters: number;
  discountPiasters: number;
  totalPiasters: number;
  createdAt: string;
  items: {
    id: string;
    nameArSnapshot: string;
    nameEnSnapshot: string;
    skuSnapshot: string;
    volumeMlSnapshot: number;
    packagingSnapshot: string;
    unitPricePiasters: number;
    quantity: number;
    lineTotalPiasters: number;
  }[];
  statusHistory: { id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string; adminUser: { name: string } | null }[];
  notes: { id: string; body: string; createdAt: string; adminUser: { name: string } }[];
};

const labels: Record<string, string> = {
  NEW: 'جديد',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
};

const nextStatuses: Record<string, string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/orders/' + id, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تحميل الطلب.');
    setOrder(data.order as OrderData);
  }, [id]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/orders/' + id, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل الطلب.');
        if (active) setOrder(data.order as OrderData);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'تعذر تحميل الطلب.'); });
    fetch('/api/storefront/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => { if (active) setWhatsapp(data.settings?.whatsapp || ''); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [id]);

  async function updateStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status) return;
    if (status === 'CANCELLED' && !note.trim()) {
      setError('اكتب سبب إلغاء الطلب.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/orders/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحديث حالة الطلب.');
      setStatus('');
      setNote('');
      setMessage('تم تحديث الحالة.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحديث حالة الطلب.');
    } finally {
      setBusy(false);
    }
  }

  async function addInternalNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/orders/' + id + '/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: internalNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر إضافة الملاحظة.');
      setInternalNote('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر إضافة الملاحظة.');
    } finally {
      setBusy(false);
    }
  }

  async function setPayment(status: 'PAID' | 'UNPAID') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/orders/' + id + '/payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحديث حالة الدفع.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحديث حالة الدفع.');
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return <section><Link href='/admin/orders' className='font-bold underline'>العودة للطلبات</Link><p className='mt-5'>{error || 'جارٍ تحميل الطلب…'}</p></section>;
  }

  const contactDigits = order.customerPhone.replace(/\D/g, '');
  const waLink = whatsapp
    ? 'https://wa.me/' + contactDigits + '?text=' + encodeURIComponent('بخصوص طلبك ' + order.orderNumber)
    : null;

  return (
    <section>
      <Link href='/admin/orders' className='text-sm font-bold text-[var(--olive-800)] underline'>← العودة للطلبات</Link>
      <div className='mt-3 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='text-sm font-bold text-[var(--olive-600)]'>{labels[order.status]}</p>
          <h1 className='text-3xl font-black text-[var(--olive-950)]' dir='ltr'>{order.orderNumber}</h1>
        </div>
        <div className='flex gap-2'>
          <a href={'tel:' + order.customerPhone} className='btn-secondary'>اتصال بالعميل</a>
          {waLink && <a href={waLink} target='_blank' rel='noreferrer' className='btn-secondary'>WhatsApp</a>}
        </div>
      </div>

      {error && <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      {message && <p className='mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-900' role='status'>{message}</p>}

      <div className='mt-5 grid gap-5 xl:grid-cols-[1fr_380px]'>
        <div className='grid gap-5'>
          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>بيانات العميل والتوصيل</h2>
            <dl className='mt-4 grid gap-3 sm:grid-cols-2'>
              <div><dt className='text-xs text-[var(--muted)]'>الاسم</dt><dd className='font-semibold'>{order.customerName}</dd></div>
              <div><dt className='text-xs text-[var(--muted)]'>الهاتف</dt><dd className='font-semibold' dir='ltr'>{order.customerPhone}</dd></div>
              <div><dt className='text-xs text-[var(--muted)]'>المنطقة</dt><dd>{order.deliveryZoneLabel}</dd></div>
              <div><dt className='text-xs text-[var(--muted)]'>العنوان</dt><dd>{order.address} · مبنى {order.buildingNumber}{order.floorApartment ? ' · ' + order.floorApartment : ''}</dd></div>
              <div><dt className='text-xs text-[var(--muted)]'>علامة مميزة</dt><dd>{order.landmark}</dd></div>
              <div><dt className='text-xs text-[var(--muted)]'>تفضيل التواصل</dt><dd>{order.contactPreference === 'WHATSAPP' ? 'WhatsApp' : order.contactPreference === 'PHONE' ? 'مكالمة هاتفية' : 'غير محدد'}</dd></div>
              {order.customerNotes && <div className='sm:col-span-2'><dt className='text-xs text-[var(--muted)]'>ملاحظات العميل</dt><dd>{order.customerNotes}</dd></div>}
            </dl>
          </article>

          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>المنتجات والأسعار وقت الطلب</h2>
            <div className='mt-4 divide-y divide-[var(--line)]'>
              {order.items.map((item) => (
                <div key={item.id} className='flex justify-between gap-4 py-3'>
                  <div>
                    <p className='font-bold'>{item.nameArSnapshot}</p>
                    <p className='text-sm text-[var(--muted)]'>{capacityLabel(item.volumeMlSnapshot, 'ar')} · {packageLabel(item.packagingSnapshot, 'ar')} × {item.quantity}</p>
                    <p className='text-xs text-[var(--muted)]'>{formatEgp(item.unitPricePiasters)} للوحدة</p>
                  </div>
                  <p className='font-bold'>{formatEgp(item.lineTotalPiasters)}</p>
                </div>
              ))}
            </div>
            <dl className='mt-4 space-y-2'>
              <div className='flex justify-between'><dt>المجموع الفرعي</dt><dd>{formatEgp(order.subtotalPiasters)}</dd></div>
              <div className='flex justify-between'><dt>التوصيل</dt><dd>{formatEgp(order.deliveryPiasters)}</dd></div>
              <div className='flex justify-between border-t border-[var(--line)] pt-3 text-lg font-extrabold'><dt>الإجمالي</dt><dd>{formatEgp(order.totalPiasters)}</dd></div>
            </dl>
          </article>

          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>سجل الحالة</h2>
            <ol className='mt-4 space-y-3'>
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className='border-r-2 border-[var(--olive-600)] pr-4'>
                  <p className='font-bold'>{labels[entry.toStatus] || entry.toStatus}</p>
                  <p className='text-xs text-[var(--muted)]'>{entry.adminUser?.name || 'العميل'} · {new Date(entry.createdAt).toLocaleString('ar-EG')}</p>
                  {entry.note && <p className='text-sm'>{entry.note}</p>}
                </li>
              ))}
            </ol>
          </article>

          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>ملاحظات داخلية</h2>
            <form className='mt-4 grid gap-3' onSubmit={addInternalNote}>
              <textarea className='field-control min-h-24' required maxLength={2000} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder='ملاحظة لا تظهر للعميل' />
              <button className='btn-secondary justify-self-start' disabled={busy}>إضافة ملاحظة</button>
            </form>
            <ul className='mt-4 space-y-3'>
              {order.notes.map((entry) => (
                <li key={entry.id} className='rounded-xl bg-[var(--cream-50)] p-3'>
                  <p className='whitespace-pre-line'>{entry.body}</p>
                  <p className='mt-1 text-xs text-[var(--muted)]'>{entry.adminUser.name} · {new Date(entry.createdAt).toLocaleString('ar-EG')}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className='grid content-start gap-5'>
          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>تحديث الحالة</h2>
            {nextStatuses[order.status].length ? (
              <form className='mt-4 grid gap-3' onSubmit={updateStatus}>
                <label>
                  <span className='field-label'>الحالة الجديدة</span>
                  <select className='field-control' required value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value=''>اختر الحالة</option>
                    {nextStatuses[order.status].map((next) => <option value={next} key={next}>{labels[next]}</option>)}
                  </select>
                </label>
                {(status === 'CANCELLED' || order.status === 'PROCESSING') && (
                  <label>
                    <span className='field-label'>{status === 'CANCELLED' ? 'سبب الإلغاء' : 'ملاحظة (اختيارية)'}</span>
                    <textarea className='field-control min-h-20' maxLength={500} required={status === 'CANCELLED'} value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                )}
                <button className='btn-primary' disabled={busy || !status}>حفظ الحالة</button>
              </form>
            ) : <p className='mt-3 text-sm text-[var(--muted)]'>هذه حالة نهائية.</p>}
          </article>

          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>الدفع النقدي</h2>
            <p className='mt-2 text-sm text-[var(--muted)]'>{order.paymentStatus === 'PAID' ? 'تم تسجيل استلام المبلغ.' : 'لم يتم تسجيل استلام المبلغ بعد.'}</p>
            <button type='button' onClick={() => setPayment(order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID')} disabled={busy || order.status === 'CANCELLED'} className='btn-secondary mt-4 w-full'>
              {order.paymentStatus === 'PAID' ? 'إلغاء تسجيل التحصيل' : 'تسجيل استلام المبلغ'}
            </button>
          </article>
        </aside>
      </div>
    </section>
  );
}

