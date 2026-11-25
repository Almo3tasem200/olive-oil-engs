import { OrderDetail } from '@/frontend/components/admin/OrderDetail';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Context) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}

