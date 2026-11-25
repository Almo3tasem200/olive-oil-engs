import { HowToOrderView } from '@/frontend/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'طريقة الطلب' };

export default function HowToOrderPage() {
  return <HowToOrderView locale='ar' />;
}
