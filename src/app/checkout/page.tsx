import { prisma } from '@/backend/db';
import { getCurrentCustomer } from '@/backend/customer-auth';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';
import { CheckoutView } from '@/frontend/components/checkout/CheckoutView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  if (!await getCurrentCustomer()) {
    redirect('/account/login?returnTo=%2Fcheckout');
  }
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  return <StorePageShell settings={settings}><CheckoutView locale='ar' /></StorePageShell>;
}

