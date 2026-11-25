import { CustomerPasswordResetForm } from '@/frontend/components/store/CustomerPasswordResetForm';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';

export const metadata = { title: 'Reset password', robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <StorePageShell locale='en'>
      <section className='container-shell grid min-h-[65vh] place-items-center py-12'>
        <div className='w-full max-w-md' dir='ltr'>
          <p className='mb-2 text-sm font-bold text-[var(--olive-600)]'>Customer account</p>
          <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>Reset your password</h1>
          <p className='mb-6 text-[var(--muted)]'>Enter your email and we’ll send a verification code so you can set a new password.</p>
          <CustomerPasswordResetForm locale='en' />
        </div>
      </section>
    </StorePageShell>
  );
}
