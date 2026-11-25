import { FaqView } from '@/frontend/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الأسئلة الشائعة' };

export default function FaqPage() {
  return <FaqView locale='ar' />;
}
