import { prisma } from '@/lib/db';
import { StorePageShell } from '@/components/store/StorePageShell';
import { CheckoutView } from '@/components/checkout/CheckoutView';

export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function EnglishCheckoutPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  return <StorePageShell locale='en' settings={settings}><CheckoutView locale='en' /></StorePageShell>;
}

