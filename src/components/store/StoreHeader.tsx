'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { ThemeToggle } from '@/components/store/ThemeToggle';

export function StoreHeader({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logoUrl: string | null } | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname();
  const english = locale === 'en';
  const prefix = english ? '/en' : '';
  const signInLabel = english ? 'Sign in' : 'تسجيل الدخول';
  const signUpLabel = english ? 'Sign up' : 'إنشاء حساب';
  const accountLabel = english ? 'My account' : 'حسابي';
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

  useEffect(() => {
    fetch('/api/customer/auth/me', { cache: 'no-store' })
      .then((response) => setSignedIn(response.ok))
      .catch(() => setSignedIn(false));
  }, [pathname]);

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
          <Link href={english ? '/' : '/en'} aria-label={label.language} className='rounded-lg px-2 py-2 text-sm font-semibold hover:bg-white'>
            <span className='hidden sm:inline'>{label.language}</span>
            <span className='sm:hidden'>{english ? 'AR' : 'EN'}</span>
          </Link>
          <ThemeToggle locale={locale} className='hidden md:grid' />
          {signedIn ? (
            <Link href={prefix + '/account'} className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold' aria-label={accountLabel}>
              <UserRound size={18} aria-hidden='true' />
              <span className='hidden sm:inline'>{accountLabel}</span>
            </Link>
          ) : (
            <>
              <Link href={prefix + '/account/login'} className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold' aria-label={signInLabel}>
                <UserRound size={18} aria-hidden='true' />
                <span className='hidden sm:inline'>{signInLabel}</span>
              </Link>
              <Link href={prefix + '/account/signup'} className='hidden min-h-11 items-center rounded-xl bg-[var(--button-primary-bg)] px-3 text-sm font-bold text-on-primary hover:bg-[var(--button-primary-hover)] md:inline-flex'>
                {signUpLabel}
              </Link>
            </>
          )}
          <Link href={prefix + '/cart'} className='relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold' aria-label={label.cart + ' ' + count}>
            <ShoppingBag size={18} aria-hidden='true' />
            <span className='hidden sm:inline'>{label.cart}</span>
            {count > 0 && <span className='text-on-primary grid min-w-5 place-items-center rounded-full bg-[var(--button-primary-bg)] px-1 text-xs'>{count}</span>}
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
      <div className='container-shell flex min-h-11 items-center justify-center gap-3 border-t border-[var(--line)] text-sm font-semibold md:hidden'>
        {signedIn ? (
          <Link href={prefix + '/account'} className='inline-flex min-h-11 items-center px-3'>{accountLabel}</Link>
        ) : (
          <>
            <Link href={prefix + '/account/login'} className='inline-flex min-h-11 items-center px-3'>{signInLabel}</Link>
            <span aria-hidden='true' className='text-[var(--muted)]'>·</span>
            <Link href={prefix + '/account/signup'} className='inline-flex min-h-11 items-center px-3'>{signUpLabel}</Link>
          </>
        )}
        <ThemeToggle locale={locale} className='md:hidden' />
      </div>
      {menuOpen && (
        <nav className='container-shell grid gap-1 border-t border-[var(--line)] py-3 md:hidden' aria-label={english ? 'Mobile navigation' : 'التنقل'}>
          <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix || '/'} onClick={() => setMenuOpen(false)}>{label.home}</Link>
          <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/products'} onClick={() => setMenuOpen(false)}>{label.products}</Link>
          <a className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/#how-to-order'} onClick={() => setMenuOpen(false)}>{label.order}</a>
          {signedIn ? (
            <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/account'} onClick={() => setMenuOpen(false)}>{accountLabel}</Link>
          ) : (
            <>
              <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/account/login'} onClick={() => setMenuOpen(false)}>{signInLabel}</Link>
              <Link className='rounded-lg px-3 py-2 font-semibold hover:bg-white' href={prefix + '/account/signup'} onClick={() => setMenuOpen(false)}>{signUpLabel}</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

