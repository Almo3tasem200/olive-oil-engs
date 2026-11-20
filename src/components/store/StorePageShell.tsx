import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';

type Settings = {
  phone?: string | null;
  whatsapp?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  deliveryPolicyAr?: string | null;
  deliveryPolicyEn?: string | null;
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
    <>
      <StoreHeader locale={locale} />
      <main>{children}</main>
      <StoreFooter settings={settings} locale={locale} />
    </>
  );
}

