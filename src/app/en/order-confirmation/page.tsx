import { OrderConfirmationView } from '@/frontend/components/store/OrderConfirmationView';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default function EnglishOrderConfirmationPage() {
  return <OrderConfirmationView locale='en' />;
}

