import Link from 'next/link';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { ThemeToggle } from '@/components/store/ThemeToggle';

export const metadata = { robots: { index: false, follow: false }, title: 'دخول الإدارة' };

export default function AdminLoginPage() {
  return (
    <main className='grid min-h-screen place-items-center bg-[var(--cream-50)] px-4 py-12'>
      <div className='w-full max-w-md'>
        <div className='mb-4 flex justify-end'><ThemeToggle /></div>
        <Link href='/' className='mb-5 inline-block font-bold text-[var(--olive-800)]'>← العودة إلى المتجر</Link>
        <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>تسجيل دخول الإدارة</h1>
        <p className='mb-6 text-[var(--muted)]'>هذه الصفحة مخصصة لحسابات الإدارة المعتمدة.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}

