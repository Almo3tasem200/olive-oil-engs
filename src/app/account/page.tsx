import { CustomerAccountPanel } from '@/frontend/components/store/CustomerAccountPanel';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';

export const metadata = { title: 'حسابي', robots: { index: false, follow: false } };

export default function CustomerAccountPage() {
  return (
    <StorePageShell locale='ar'>
      <section className='container-shell min-h-[65vh] py-12'>
        <div className='mb-7' dir='rtl'>
          <p className='text-sm font-bold text-[var(--olive-600)]'>حساب العميل</p>
          <h1 className='mt-1 text-4xl font-black text-[var(--olive-950)]'>حسابي</h1>
        </div>
        <CustomerAccountPanel locale='ar' />
      </section>
    </StorePageShell>
  );
}
