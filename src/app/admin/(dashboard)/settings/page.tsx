import { redirect } from 'next/navigation';
import { StoreSettingsAdmin } from '@/components/admin/StoreSettingsAdmin';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageSettings } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  if (!canManageSettings(admin.role)) redirect('/admin');
  return <StoreSettingsAdmin />;
}
