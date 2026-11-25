'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatEgp } from '@/shared/money';

type AccountResponse = {
  customer: { name: string; email: string };
  orders: { orderNumber: string; status: string; totalPiasters: number; createdAt: string }[];
};

export function CustomerAccountPanel({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const router = useRouter();
  const english = locale === 'en';
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/customer/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Sign in required.');
        setAccount(result as AccountResponse);
      })
      .catch(() => setError(english ? 'Sign in to view your account.' : 'سجّل الدخول لعرض حسابك.'))
      .finally(() => setLoading(false));
  }, [english]);

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/customer/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error(english ? 'Could not sign out.' : 'تعذر تسجيل الخروج.');
      router.replace(english ? '/en/account/login' : '/account/login');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? 'Could not sign out.' : 'تعذر تسجيل الخروج.'));
      setBusy(false);
    }
  }

  if (loading) return <div className='card-surface p-8 text-center text-[var(--muted)]' aria-live='polite'>{english ? 'Loading account…' : 'جارٍ تحميل الحساب…'}</div>;
  if (!account) {
    return (
      <div className='card-surface grid gap-4 p-8 text-center'>
        <p className='text-[var(--muted)]'>{error}</p>
        <Link className='btn-primary justify-center' href={english ? '/en/account/login' : '/account/login'}>{english ? 'Sign in' : 'تسجيل الدخول'}</Link>
      </div>
    );
  }

  const statusLabel: Record<string, string> = english
    ? { NEW: 'New', CONFIRMED: 'Confirmed', PROCESSING: 'Processing', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' }
    : { NEW: 'جديد', CONFIRMED: 'تم التأكيد', PROCESSING: 'قيد التجهيز', SHIPPED: 'تم الشحن', DELIVERED: 'تم التسليم', CANCELLED: 'ملغي' };

  return (
    <div className='grid gap-6'>
      <section className='card-surface flex flex-wrap items-center justify-between gap-4 p-6'>
        <div>
          <p className='text-sm text-[var(--muted)]'>{english ? 'Signed in as' : 'تم تسجيل الدخول باسم'}</p>
          <h2 className='mt-1 text-xl font-extrabold text-[var(--olive-950)]'>{account.customer.name}</h2>
          <p className='mt-1 text-sm text-[var(--muted)]' dir='ltr'>{account.customer.email}</p>
        </div>
        <button type='button' className='btn-secondary' onClick={signOut} disabled={busy}>
          {busy ? (english ? 'Please wait…' : 'جارٍ التنفيذ…') : (english ? 'Sign out' : 'تسجيل الخروج')}
        </button>
      </section>
      {error && <p className='rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      <section>
        <h2 className='mb-4 text-2xl font-extrabold text-[var(--olive-950)]'>{english ? 'Your recent orders' : 'طلباتك الأخيرة'}</h2>
        {account.orders.length ? (
          <div className='grid gap-3'>
            {account.orders.map((order) => (
              <article key={order.orderNumber} className='card-surface flex flex-wrap items-center justify-between gap-3 p-5'>
                <div>
                  <p className='font-bold' dir='ltr'>{order.orderNumber}</p>
                  <p className='mt-1 text-sm text-[var(--muted)]'>{statusLabel[order.status] || order.status} · {new Intl.DateTimeFormat(english ? 'en-EG' : 'ar-EG', { dateStyle: 'medium' }).format(new Date(order.createdAt))}</p>
                </div>
                <p className='font-extrabold text-[var(--olive-950)]'>{formatEgp(order.totalPiasters, locale)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className='card-surface p-6 text-[var(--muted)]'>{english ? 'Orders placed while signed in will appear here. Guest orders remain available from their confirmation link.' : 'ستظهر هنا الطلبات التي ترسلها أثناء تسجيل الدخول. تبقى طلبات الزوار متاحة من رابط تأكيد الطلب.'}</div>
        )}
      </section>
    </div>
  );
}
