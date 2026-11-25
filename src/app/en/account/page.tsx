import { CustomerAccountPanel } from '@/frontend/components/store/CustomerAccountPanel';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';

export const metadata = { title: 'My account', robots: { index: false, follow: false } };

export default function CustomerAccountPage() {
  return (
    <StorePageShell locale='en'>
      <section className='container-shell min-h-[65vh] py-12'>
        <div className='mb-7' dir='ltr'>
          <p className='text-sm font-bold text-[var(--olive-600)]'>Customer account</p>
          <h1 className='mt-1 text-4xl font-black text-[var(--olive-950)]'>My account</h1>
        </div>
        <CustomerAccountPanel locale='en' />
      </section>
    </StorePageShell>
  );
}
