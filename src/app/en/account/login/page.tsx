import { CustomerAccessForm } from '@/components/store/CustomerAccessForm';
import { StorePageShell } from '@/components/store/StorePageShell';

export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function CustomerLoginPage() {
  return (
    <StorePageShell locale='en'>
      <section className='container-shell grid min-h-[65vh] place-items-center py-12'>
        <div className='w-full max-w-md' dir='ltr'>
          <p className='mb-2 text-sm font-bold text-[var(--olive-600)]'>Customer account</p>
          <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>Sign in</h1>
          <p className='mb-6 text-[var(--muted)]'>Sign in to review orders you placed while signed in.</p>
          <CustomerAccessForm mode='login' locale='en' />
        </div>
      </section>
    </StorePageShell>
  );
}
