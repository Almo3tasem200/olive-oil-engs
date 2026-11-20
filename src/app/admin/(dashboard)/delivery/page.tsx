import { redirect } from 'next/navigation';
import { DeliveryAdmin } from '@/components/admin/DeliveryAdmin';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageDelivery } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminDeliveryPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  if (!canManageDelivery(admin.role)) redirect('/admin');
  return <DeliveryAdmin />;
}
