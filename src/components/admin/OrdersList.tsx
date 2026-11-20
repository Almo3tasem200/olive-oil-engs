'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatEgp } from '@/lib/money';

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  area: string;
  status: string;
  paymentStatus: string;
  totalPiasters: number;
  createdAt: string;
};

const labels: Record<string, string> = {
  NEW: 'جديد',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
};

export function OrdersList({ initialStatus = '' }: { initialStatus?: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (targetPage = page) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (status) params.set('status', status);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
    params.set('page', String(targetPage));
    try {
      const response = await fetch('/api/admin/orders?' + params.toString(), { cache: 'no-store' });
      setError('');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحميل الطلبات.');
      setOrders(data.orders as OrderRow[]);
      setPage(data.page as number);
      setTotal(data.total as number);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل الطلبات.');
    } finally {
      setLoading(false);
    }
  }, [from, page, query, status, to]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (initialStatus) params.set('status', initialStatus);
    fetch('/api/admin/orders?' + params.toString(), { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل الطلبات.');
        if (active) setOrders(data.orders as OrderRow[]);
        if (active) setTotal(data.total as number);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'تعذر تحميل الطلبات.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialStatus]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    void load(1);
  }

  return (
    <section>
      <div>
        <p className='text-sm font-bold text-[var(--olive-600)]'>الطلبات</p>
        <h1 className='text-3xl font-black text-[var(--olive-950)]'>إدارة الطلبات</h1>
      </div>
      <form onSubmit={submit} className='card-surface mt-5 grid gap-3 p-4 md:grid-cols-5'>
        <label className='md:col-span-2'>
          <span className='field-label'>بحث برقم الطلب أو الاسم أو الهاتف</span>
          <input className='field-control' value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span className='field-label'>الحالة</span>
          <select className='field-control' value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value=''>كل الحالات</option>
            {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className='field-label'>من تاريخ</span>
          <input className='field-control' type='date' value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          <span className='field-label'>إلى تاريخ</span>
          <input className='field-control' type='date' value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button className='btn-primary md:col-span-5' type='submit'>تطبيق البحث</button>
      </form>

      {error && <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]'>{error}</p>}
      <div className='card-surface mt-5 overflow-hidden'>
        {loading ? <p className='p-5 text-sm text-[var(--muted)]'>جارٍ تحميل الطلبات…</p> : orders.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-right text-sm'>
              <thead className='bg-[var(--olive-100)]'>
                <tr><th className='p-3'>رقم الطلب</th><th className='p-3'>العميل</th><th className='p-3'>الهاتف</th><th className='p-3'>المنطقة</th><th className='p-3'>الحالة</th><th className='p-3'>الإجمالي</th><th className='p-3'>التاريخ</th></tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className='border-t border-[var(--line)]'>
                    <td className='p-3'><Link className='font-bold underline' href={'/admin/orders/' + order.id} dir='ltr'>{order.orderNumber}</Link></td>
                    <td className='p-3'>{order.customerName}</td>
                    <td className='p-3' dir='ltr'>{order.customerPhone}</td>
                    <td className='p-3'>{order.area}</td>
                    <td className='p-3'>{labels[order.status] || order.status}</td>
                    <td className='p-3 font-bold'>{formatEgp(order.totalPiasters)}</td>
                    <td className='p-3' dir='ltr'>{new Date(order.createdAt).toLocaleString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className='p-5 text-sm text-[var(--muted)]'>لا توجد طلبات مطابقة.</p>}
        {!loading && total > 25 && (
          <div className='flex items-center justify-between border-t border-[var(--line)] p-4 text-sm'>
            <button type='button' className='btn-secondary min-h-9 px-3' disabled={page <= 1} onClick={() => { setLoading(true); void load(page - 1); }}>السابق</button>
            <span>صفحة {page} من {Math.ceil(total / 25)} · {total} طلب</span>
            <button type='button' className='btn-secondary min-h-9 px-3' disabled={page >= Math.ceil(total / 25)} onClick={() => { setLoading(true); void load(page + 1); }}>التالي</button>
          </div>
        )}
      </div>
    </section>
  );
}

