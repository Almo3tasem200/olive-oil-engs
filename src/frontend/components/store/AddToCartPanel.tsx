'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/frontend/components/cart/CartProvider';

export function AddToCartPanel({ productId, locale = 'ar' }: { productId: string; locale?: 'ar' | 'en' }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const prefix = locale === 'en' ? '/en' : '';

  function add(buyNow: boolean) {
    addItem(productId, quantity);
    setMessage(locale === 'en' ? 'Added to cart.' : 'أُضيف المنتج إلى السلة.');
    if (buyNow) router.push(prefix + '/checkout');
  }

  return (
    <div className='mt-6 grid gap-3'>
      <label className='max-w-40'>
        <span className='field-label'>{locale === 'en' ? 'Quantity' : 'الكمية'}</span>
        <input
          className='field-control'
          type='number'
          min={1}
          max={99}
          step={1}
          inputMode='numeric'
          value={quantity}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isSafeInteger(value)) setQuantity(Math.min(99, Math.max(1, value)));
          }}
        />
      </label>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <button type='button' className='btn-primary' onClick={() => add(false)}>
          {locale === 'en' ? 'Add to cart' : 'أضف للسلة'}
        </button>
        <button type='button' className='btn-secondary' onClick={() => add(true)}>
          {locale === 'en' ? 'Buy now' : 'اطلب الآن'}
        </button>
      </div>
      <p className='min-h-6 text-sm text-[var(--olive-800)]' role='status' aria-live='polite'>{message}</p>
    </div>
  );
}

