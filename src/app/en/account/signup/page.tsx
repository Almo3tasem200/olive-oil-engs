import { CustomerAccessForm } from '@/components/store/CustomerAccessForm';
import { StorePageShell } from '@/components/store/StorePageShell';

export const metadata = { title: 'Create account', robots: { index: false, follow: false } };

export default function CustomerSignupPage() {
  return (
    <StorePageShell locale='en'>
      <section className='container-shell grid min-h-[65vh] place-items-center py-12'>
        <div className='w-full max-w-md' dir='ltr'>
          <p className='mb-2 text-sm font-bold text-[var(--olive-600)]'>Customer account</p>
          <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>Create an account</h1>
          <p className='mb-6 text-[var(--muted)]'>Create an account to keep track of your orders. Guest checkout is also available.</p>
          <CustomerAccessForm mode='register' locale='en' />
        </div>
      </section>
    </StorePageShell>
  );
}
