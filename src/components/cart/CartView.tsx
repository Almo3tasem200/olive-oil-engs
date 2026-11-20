'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import type { StoreProduct } from '@/components/store/ProductCard';
import { formatEgp } from '@/lib/money';
import { capacityLabel, packageLabel } from '@/components/store/ProductCard';

export function CartView({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const prefix = english ? '/en' : '';
  const { items, ready, setQuantity, removeItem } = useCart();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/catalog/products?locale=' + locale, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load current products.');
        return response.json();
      })
      .then((data) => {
        if (active) setProducts(data.products as StoreProduct[]);
      })
      .catch(() => {
        if (active) setError(english ? 'Could not load current prices. Try again.' : 'تعذر تحميل الأسعار الحالية. حاول مرة أخرى.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [locale, english]);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const lines = items.map((item) => ({ ...item, product: productById.get(item.productId) }));
  const validLines = lines.filter((line) => line.product);
  const subtotal = validLines.reduce((sum, line) => sum + line.product!.pricePiasters * line.quantity, 0);

  return (
    <section className='container-shell py-10 md:py-14'>
      <h1 className='text-3xl font-black text-[var(--olive-950)]'>{english ? 'Your cart' : 'سلة التسوق'}</h1>
      {!ready || loading ? (
        <p className='mt-6 text-[var(--muted)]'>{english ? 'Loading your cart…' : 'جارٍ تحميل السلة…'}</p>
      ) : error ? (
        <div className='mt-6 rounded-xl bg-red-50 p-4 text-[var(--danger)]'>{error}</div>
      ) : items.length === 0 ? (
        <div className='card-surface mt-6 grid gap-4 p-8 text-center'>
          <p className='text-[var(--muted)]'>{english ? 'Your cart is empty.' : 'السلة فارغة.'}</p>
          <Link href={prefix + '/products'} className='btn-primary mx-auto'>{english ? 'Browse products' : 'تصفّح المنتجات'}</Link>
        </div>
      ) : (
        <div className='mt-7 grid items-start gap-6 lg:grid-cols-[1fr_350px]'>
          <div className='grid gap-3'>
            {lines.map((line) => line.product ? (
              <article key={line.productId} className='card-surface grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
                <div>
                  <Link href={prefix + '/products/' + line.product.slug} className='text-lg font-bold text-[var(--olive-950)] hover:underline'>{line.product.name}</Link>
                  <p className='text-sm text-[var(--muted)]'>{capacityLabel(line.product.volumeMl, locale)} · {packageLabel(line.product.packaging, locale)}</p>
                  <p className='mt-2 font-bold'>{formatEgp(line.product.pricePiasters, locale)}</p>
                </div>
                <div className='flex items-center justify-between gap-3 sm:justify-end'>
                  <div className='flex items-center rounded-xl border border-[var(--line)] bg-white'>
                    <button type='button' className='grid size-11 place-items-center' onClick={() => line.quantity > 1 ? setQuantity(line.productId, line.quantity - 1) : removeItem(line.productId)} aria-label={english ? 'Decrease quantity' : 'تقليل الكمية'}>
                      <Minus size={16} />
                    </button>
                    <span className='min-w-9 text-center font-bold'>{line.quantity}</span>
                    <button type='button' className='grid size-11 place-items-center' onClick={() => setQuantity(line.productId, Math.min(99, line.quantity + 1))} aria-label={english ? 'Increase quantity' : 'زيادة الكمية'}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <button type='button' onClick={() => removeItem(line.productId)} className='grid size-11 place-items-center rounded-lg text-[var(--danger)] hover:bg-red-50' aria-label={english ? 'Remove product' : 'حذف المنتج'}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ) : (
              <article key={line.productId} className='card-surface flex items-center justify-between gap-3 p-4'>
                <p className='text-sm text-[var(--muted)]'>{english ? 'A product in your cart is no longer available.' : 'أحد المنتجات في السلة لم يعد متاحًا.'}</p>
                <button type='button' onClick={() => removeItem(line.productId)} className='font-bold text-[var(--danger)] underline'>{english ? 'Remove' : 'حذف'}</button>
              </article>
            ))}
          </div>
          <aside className='card-surface p-5 lg:sticky lg:top-24'>
            <h2 className='text-xl font-extrabold'>{english ? 'Summary' : 'ملخص الطلب'}</h2>
            <div className='mt-4 flex justify-between gap-4'>
              <span>{english ? 'Subtotal' : 'المجموع الفرعي'}</span>
              <strong>{formatEgp(subtotal, locale)}</strong>
            </div>
            <p className='mt-3 text-sm text-[var(--muted)]'>
              {english ? 'Delivery is calculated after you choose a supported area.' : 'تُحسب رسوم التوصيل بعد اختيار منطقة متاحة.'}
            </p>
            <Link
              href={prefix + '/checkout'}
              aria-disabled={validLines.length !== items.length || validLines.length === 0}
              className={'btn-primary mt-5 w-full ' + (validLines.length !== items.length || validLines.length === 0 ? 'pointer-events-none opacity-50' : '')}
            >
              {english ? 'Continue to checkout' : 'متابعة إلى إتمام الطلب'}
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

