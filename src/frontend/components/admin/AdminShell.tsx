'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Bell, LogOut, Menu, Package, Settings2, ShoppingCart, Truck, X } from 'lucide-react';
import { ThemeToggle } from '@/frontend/components/store/ThemeToggle';
import { AdminLanguageToggle, AdminLocaleProvider, useAdminLocale } from '@/frontend/components/admin/AdminLocale';

type Role = 'OWNER' | 'MANAGER' | 'FULFILLMENT';

export function AdminShell({
  children,
  admin,
}: Readonly<{ children: React.ReactNode; admin: { name: string; email: string; role: Role } }>) {
  return (
    <AdminLocaleProvider>
      <AdminShellContent admin={admin}>{children}</AdminShellContent>
    </AdminLocaleProvider>
  );
}

function AdminShellContent({
  children,
  admin,
}: Readonly<{ children: React.ReactNode; admin: { name: string; email: string; role: Role } }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useAdminLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const nav = [
    { href: '/admin', label: locale === 'en' ? 'Overview' : 'نظرة عامة', icon: BarChart3, roles: ['OWNER', 'MANAGER', 'FULFILLMENT'] },
    { href: '/admin/orders', label: locale === 'en' ? 'Orders' : 'الطلبات', icon: ShoppingCart, roles: ['OWNER', 'MANAGER', 'FULFILLMENT'] },
    { href: '/admin/notifications', label: locale === 'en' ? 'Notifications' : 'التنبيهات', icon: Bell, roles: ['OWNER', 'MANAGER', 'FULFILLMENT'] },
    { href: '/admin/products', label: locale === 'en' ? 'Products' : 'المنتجات', icon: Package, roles: ['OWNER', 'MANAGER'] },
    { href: '/admin/delivery', label: locale === 'en' ? 'Delivery' : 'التوصيل', icon: Truck, roles: ['OWNER', 'MANAGER'] },
    { href: '/admin/settings', label: locale === 'en' ? 'Store settings' : 'إعدادات المتجر', icon: Settings2, roles: ['OWNER'] },
  ].filter((item) => item.roles.includes(admin.role));

  async function logout() {
    setBusy(true);
    await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className='min-h-screen bg-[var(--cream-50)]' dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <header className='sticky top-0 z-30 border-b border-[var(--line)] bg-white'>
        <div className='container-shell flex min-h-16 items-center justify-between gap-4'>
          <Link href='/admin' className='font-extrabold text-[var(--olive-950)]'>{locale === 'en' ? 'El Mohandeseen Olive Oil Admin' : 'لوحة زيت زيتون المهندسين'}</Link>
          <div className='flex items-center gap-3'>
            <span className='hidden text-sm text-[var(--muted)] sm:block'>{admin.name} · {admin.role}</span>
            <AdminLanguageToggle />
            <ThemeToggle />
            <button type='button' onClick={logout} disabled={busy} className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-bold'>
              <LogOut size={16} aria-hidden='true' />
              <span className='hidden sm:inline'>{busy ? (locale === 'en' ? 'Signing out...' : 'جارٍ الخروج') : (locale === 'en' ? 'Logout' : 'خروج')}</span>
            </button>
            <button type='button' onClick={() => setMenuOpen((value) => !value)} className='grid size-10 place-items-center rounded-lg border border-[var(--line)] md:hidden' aria-label={menuOpen ? (locale === 'en' ? 'Close menu' : 'إغلاق القائمة') : (locale === 'en' ? 'Open menu' : 'فتح القائمة')} aria-expanded={menuOpen}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>
      <div className='container-shell grid gap-6 py-6 md:grid-cols-[220px_1fr]'>
        <nav className={(menuOpen ? 'grid' : 'hidden') + ' content-start gap-2 rounded-2xl border border-[var(--line)] bg-white p-3 md:grid'} aria-label={locale === 'en' ? 'Admin navigation' : 'تنقل لوحة الإدارة'}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={'flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold ' + (active ? 'bg-[var(--brand-panel-bg)] text-on-primary' : 'text-[var(--olive-950)] hover:bg-[var(--olive-100)]')}
              >
                <Icon size={18} aria-hidden='true' />
                {item.label}
              </Link>
            );
          })}
          <p className='mt-3 border-t border-[var(--line)] px-3 pt-3 text-xs leading-6 text-[var(--muted)]'>
            {locale === 'en'
              ? (admin.role === 'OWNER' ? 'You are the owner account allowed to edit prices.' : 'Price editing is available to the owner account only.')
              : (admin.role === 'OWNER' ? 'أنت المالك الوحيد المسموح له بتعديل الأسعار.' : 'تعديل الأسعار متاح لحساب المالك فقط.')}
          </p>
        </nav>
        <main className='min-w-0'>{children}</main>
      </div>
    </div>
  );
}

