import { redirect } from 'next/navigation';
import { ProductsAdmin } from '@/components/admin/ProductsAdmin';
import { getCurrentAdmin } from '@/lib/auth';
import { canManageProducts } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  if (!canManageProducts(admin.role)) redirect('/admin');

  return <ProductsAdmin role={admin.role === 'OWNER' ? 'OWNER' : 'MANAGER'} />;
}
