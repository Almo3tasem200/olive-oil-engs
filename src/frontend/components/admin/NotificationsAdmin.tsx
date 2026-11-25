'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatEgp } from '@/shared/money';

type NotificationRow = {
  id: string;
  status: string;
  createdAt: string;
  readAt: string | null;
  orderId: string | null;
  order: { orderNumber: string; customerName: string; totalPiasters: number } | null;
};

export function NotificationsAdmin() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/notifications', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل التنبيهات.');
        if (active) setRows(data.notifications as NotificationRow[]);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'تعذر تحميل التنبيهات.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function markRead(id: string) {
    setError('');
    const response = await fetch('/api/admin/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'تعذر تحديث التنبيه.');
      return;
    }
    setRows((current) => current.map((row) => row.id === id ? { ...row, readAt: new Date().toISOString() } : row));
  }

  const unread = rows.filter((row) => !row.readAt).length;

  return (
    <section>
      <div><p className='text-sm font-bold text-[var(--olive-600)]'>صندوق الإدارة</p><h1 className='text-3xl font-black text-[var(--olive-950)]'>تنبيهات الطلبات</h1><p className='mt-2 text-sm text-[var(--muted)]'>{unread} تنبيه غير مقروء</p></div>
      {error && <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      <div className='card-surface mt-5 divide-y divide-[var(--line)] overflow-hidden'>
        {loading ? <p className='p-5 text-sm text-[var(--muted)]'>جارٍ التحميل…</p> : rows.length ? rows.map((row) => (
          <article key={row.id} className={'flex flex-wrap items-center justify-between gap-3 p-4 ' + (!row.readAt ? 'bg-[var(--olive-100)]' : '')}>
            <div>
              <p className='font-bold'>{row.order ? `طلب جديد ${row.order.orderNumber}` : 'تنبيه من المتجر'}</p>
              <p className='mt-1 text-sm text-[var(--muted)]'>{row.order ? `${row.order.customerName} · ${formatEgp(row.order.totalPiasters)}` : row.status}</p>
              <p className='mt-1 text-xs text-[var(--muted)]'>{new Date(row.createdAt).toLocaleString('ar-EG')}</p>
            </div>
            <div className='flex gap-2'>
              {row.orderId && <Link className='btn-secondary min-h-9 px-3 text-sm' href={'/admin/orders/' + row.orderId}>فتح الطلب</Link>}
              {!row.readAt && <button type='button' className='btn-primary min-h-9 px-3 text-sm' onClick={() => void markRead(row.id)}>تحديد كمقروء</button>}
            </div>
          </article>
        )) : <p className='p-5 text-sm text-[var(--muted)]'>لا توجد تنبيهات حتى الآن.</p>}
      </div>
    </section>
  );
}
