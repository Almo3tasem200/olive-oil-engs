import { AdminLoginView } from '@/frontend/components/admin/AdminLoginView';

export const metadata = { robots: { index: false, follow: false }, title: 'دخول الإدارة' };

export default function AdminLoginPage() {
  return <AdminLoginView />;
}

