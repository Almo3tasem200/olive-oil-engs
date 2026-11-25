import { DeliveryView } from '@/frontend/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Delivery information' };

export default function EnglishDeliveryPage() {
  return <DeliveryView locale='en' />;
}
