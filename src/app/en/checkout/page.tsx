import { prisma } from '@/backend/db';
import { getCurrentCustomer } from '@/backend/customer-auth';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';
import { CheckoutView } from '@/frontend/components/checkout/CheckoutView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function EnglishCheckoutPage() {
  if (!await getCurrentCustomer()) {
    redirect('/en/account/login?returnTo=%2Fen%2Fcheckout');
  }
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  return <StorePageShell locale='en' settings={settings}><CheckoutView locale='en' /></StorePageShell>;
}

