import { prisma } from '@/backend/db';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';
import { CartView } from '@/frontend/components/cart/CartView';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  return <StorePageShell settings={settings}><CartView locale='ar' /></StorePageShell>;
}

