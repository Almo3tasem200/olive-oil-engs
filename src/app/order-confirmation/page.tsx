import { OrderConfirmationView } from '@/components/store/OrderConfirmationView';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default function OrderConfirmationPage() {
  return <OrderConfirmationView locale='ar' />;
}

