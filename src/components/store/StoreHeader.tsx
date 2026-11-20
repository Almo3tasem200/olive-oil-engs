'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';

export function StoreHeader({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logoUrl: string | null } | null>(null);
  const english = locale === 'en';
  const prefix = english ? '/en' : '';
  const label = english
    ? { home: 'Home', products: 'Products', order: 'How to order', language: 'العربية', cart: 'Cart' }
    : { home: 'الرئيسية', products: 'المنتجات', order: 'طريقة الطلب', language: 'English', cart: 'السلة' };

  useEffect(() => {
    fetch('/api/storefront/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setBrand({
        name: english ? data.settings?.businessNameEn : data.settings?.businessNameAr,
        logoUrl: data.settings?.logoUrl || null,
      }))
      .catch(() => undefined);
  }, [english]);

  return (
    <header className='sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--cream-50)]/95 backdrop-blur'>
      <div className='container-shell flex min-h-16 items-center justify-between gap-4'>
        <Link href={prefix || '/'} className='flex items-center gap-3' aria-label={english ? 'El Mohandeseen Olive Oil home' : 'الرئيسية'}>
          {brand?.logoUrl && <span className='relative size-10 shrink-0 overflow-hidden rounded-lg'><Image src={brand.logoUrl} alt='' fill sizes='40px' className='object-contain' /></span>}
          <span className='leading-tight'>
            <span className='block font-bold text-[var(--olive-950)]'>{brand?.name || (english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين')}</span>
            <span className='hidden text-xs text-[var(--muted)] sm:block'>{english ? 'El Mohandeseen Olive Oil' : 'El Mohandeseen Olive Oil'}</span>
          </span>
        </Link>
        <nav className='hidden items-center gap-6 text-sm font-semibold md:flex' aria-label={english ? 'Main navigation' : 'التنقل الرئيسي'}>
          <Link href={prefix || '/'}>{label.home}</Link>
          <Link href={prefix + '/products'}>{label.products}</Link>
          <a href={prefix + '/#how-to-order'}>{label.order}</a>
        </nav>
        <div className='flex items-center gap-2'>
          <Link href={english ? '/' : '/en'} className='rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white'>
            {label.language}
          </Link>
          <Link href={prefix + '/cart'} className='relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold' aria-label={label.cart + ' ' + count}>
            <ShoppingBag size={18} aria-hidden='true' />
            <span className='hidden sm:inline'>{label.cart}</span>
            {count > 0 && <span className='grid min-w-5 place-items-center rounded-full bg-[var(--olive-950)] px-1 text-xs text-white'>{count}</span>}
          </Link>
          <button
            type='button'
            className='grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-white md:hidden'
            aria-expanded={menuOpen}
            aria-label={menuOpen ? (english ? 'Close menu' : 'إغلاق القائمة') : (english ? 'Open menu' : 'فتح القائمة')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className='container-shell grid gap-1 border-t border-[var(--line)] py-3 md:hidden' aria-label={english ? 'Mobile navigation' : 'التنقل'}>
          <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix || '/'} onClick={() => setMenuOpen(false)}>{label.home}</Link>
          <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/products'} onClick={() => setMenuOpen(false)}>{label.products}</Link>
          <a className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/#how-to-order'} onClick={() => setMenuOpen(false)}>{label.order}</a>
        </nav>
      )}
    </header>
  );
}

