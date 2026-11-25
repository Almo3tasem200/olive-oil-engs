import { FaqView } from '@/frontend/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Frequently asked questions' };

export default function EnglishFaqPage() {
  return <FaqView locale='en' />;
}
