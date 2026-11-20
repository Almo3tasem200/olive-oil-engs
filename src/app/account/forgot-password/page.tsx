import { CustomerPasswordResetForm } from '@/components/store/CustomerPasswordResetForm';
import { StorePageShell } from '@/components/store/StorePageShell';

export const metadata = { title: 'استعادة كلمة المرور', robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <StorePageShell locale='ar'>
      <section className='container-shell grid min-h-[65vh] place-items-center py-12'>
        <div className='w-full max-w-md' dir='rtl'>
          <p className='mb-2 text-sm font-bold text-[var(--olive-600)]'>حساب العميل</p>
          <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>استعادة كلمة المرور</h1>
          <p className='mb-6 text-[var(--muted)]'>أدخل بريدك الإلكتروني لنرسل رمز تحقق يساعدك على تعيين كلمة مرور جديدة.</p>
          <CustomerPasswordResetForm locale='ar' />
        </div>
      </section>
    </StorePageShell>
  );
}
