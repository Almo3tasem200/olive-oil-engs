import { OrdersList } from '@/components/admin/OrdersList';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status = '' } = await searchParams;
  const initialStatus = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status) ? status : '';
  return <OrdersList initialStatus={initialStatus} />;
}

