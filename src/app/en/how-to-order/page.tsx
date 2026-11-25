import { HowToOrderView } from '@/frontend/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'How to order' };

export default function EnglishHowToOrderPage() {
  return <HowToOrderView locale='en' />;
}
