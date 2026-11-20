import { AboutView } from '@/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'عن المتجر' };

export default function AboutPage() {
  return <AboutView locale='ar' />;
}
