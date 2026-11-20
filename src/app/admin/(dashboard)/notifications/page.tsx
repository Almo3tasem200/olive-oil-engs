import { redirect } from 'next/navigation';
import { NotificationsAdmin } from '@/components/admin/NotificationsAdmin';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageOrders } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  if (!canManageOrders(admin.role)) redirect('/admin');
  return <NotificationsAdmin />;
}
