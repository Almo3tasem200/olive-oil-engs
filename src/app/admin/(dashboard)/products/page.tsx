import { redirect } from 'next/navigation';
import { ProductsAdmin } from '@/frontend/components/admin/ProductsAdmin';
import { getCurrentAdmin } from '@/backend/auth';
import { canManageProducts } from '@/backend/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  if (!canManageProducts(admin.role)) redirect('/admin');

  return <ProductsAdmin role={admin.role === 'OWNER' ? 'OWNER' : 'MANAGER'} />;
}
