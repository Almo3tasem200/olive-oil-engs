import { StoreHeader } from '@/frontend/components/store/StoreHeader';
import { StoreFooter } from '@/frontend/components/store/StoreFooter';

type Settings = {
  phone?: string | null;
  whatsapp?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  privacyPolicyAr?: string | null;
  privacyPolicyEn?: string | null;
  termsAr?: string | null;
  termsEn?: string | null;
};

export function StorePageShell({
  children,
  locale = 'ar',
  settings,
}: Readonly<{ children: React.ReactNode; locale?: 'ar' | 'en'; settings?: Settings | null }>) {
  return (
    <div lang={locale === 'en' ? 'en' : 'ar-EG'} dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <StoreHeader locale={locale} />
      <main>{children}</main>
      <StoreFooter settings={settings} locale={locale} />
    </div>
  );
}

