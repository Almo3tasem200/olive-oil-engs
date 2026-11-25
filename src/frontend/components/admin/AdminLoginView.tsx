'use client';

import Link from 'next/link';
import { AdminLoginForm } from '@/frontend/components/admin/AdminLoginForm';
import { AdminLanguageToggle, AdminLocaleProvider, useAdminLocale } from '@/frontend/components/admin/AdminLocale';
import { ThemeToggle } from '@/frontend/components/store/ThemeToggle';

export function AdminLoginView() {
  return (
    <AdminLocaleProvider>
      <AdminLoginContent />
    </AdminLocaleProvider>
  );
}

function AdminLoginContent() {
  const { locale } = useAdminLocale();

  return (
    <main className='grid min-h-screen place-items-center bg-[var(--cream-50)] px-4 py-12' dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <div className='w-full max-w-md'>
        <div className='mb-4 flex justify-end gap-2'>
          <AdminLanguageToggle />
          <ThemeToggle />
        </div>
        <Link href='/' className='mb-5 inline-block font-bold text-[var(--olive-800)]'>
          {locale === 'en' ? '← Back to store' : '← العودة إلى المتجر'}
        </Link>
        <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>
          {locale === 'en' ? 'Admin sign in' : 'تسجيل دخول الإدارة'}
        </h1>
        <p className='mb-6 text-[var(--muted)]'>
          {locale === 'en' ? 'This page is for authorized admin accounts.' : 'هذه الصفحة مخصصة لحسابات الإدارة المعتمدة.'}
        </p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
