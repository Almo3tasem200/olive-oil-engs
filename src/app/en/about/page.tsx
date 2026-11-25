import { AboutView } from '@/frontend/components/store/PublicInfoViews';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'About the store' };

export default function EnglishAboutPage() {
  return <AboutView locale='en' />;
}
