import { CustomerAccessForm } from '@/frontend/components/store/CustomerAccessForm';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';
import { customerCheckoutReturnPath } from '@/shared/customer-navigation';

export const metadata = { title: 'إنشاء حساب', robots: { index: false, follow: false } };

export default async function CustomerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const returnTo = customerCheckoutReturnPath((await searchParams).returnTo, 'ar');
  return (
    <StorePageShell locale='ar'>
      <section className='container-shell grid min-h-[65vh] place-items-center py-12'>
        <div className='w-full max-w-md' dir='rtl'>
          <p className='mb-2 text-sm font-bold text-[var(--olive-600)]'>حساب العميل</p>
          <h1 className='mb-2 text-3xl font-black text-[var(--olive-950)]'>إنشاء حساب جديد</h1>
          <p className='mb-6 text-[var(--muted)]'>أنشئ حسابًا لمتابعة طلباتك وإتمام عملية الشراء.</p>
          <CustomerAccessForm mode='register' locale='ar' returnTo={returnTo} />
        </div>
      </section>
    </StorePageShell>
  );
}
