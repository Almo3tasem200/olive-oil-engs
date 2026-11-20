import { DeliveryView } from '@/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'معلومات التوصيل' };

export default function DeliveryPage() {
  return <DeliveryView locale='ar' />;
}
