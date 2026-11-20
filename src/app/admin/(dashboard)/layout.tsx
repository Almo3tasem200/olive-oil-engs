import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={{ name: admin.name, email: admin.email, role: admin.role }}>
      {children}
    </AdminShell>
  );
}

