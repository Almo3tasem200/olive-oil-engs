import Link from 'next/link';

type FooterSettings = {
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

export function StoreFooter({ settings, locale = 'ar' }: { settings?: FooterSettings | null; locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  return (
    <footer className='mt-20 bg-[var(--brand-panel-bg)] py-10 text-white'>
      <div className='container-shell grid gap-8 sm:grid-cols-2'>
        <div>
          <p className='text-lg font-bold'>{english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}</p>
          <p className='mt-2 max-w-md text-sm text-white/75'>
            {english ? 'Choose a size and place your order online.' : 'اختار الحجم المناسب واطلب بسهولة.'}
          </p>
          {(settings?.deliveryPolicyAr || settings?.deliveryPolicyEn) && (
            <p className='mt-4 max-w-md text-sm text-white/75'>
              {english ? settings.deliveryPolicyEn : settings.deliveryPolicyAr}
            </p>
          )}
        </div>
        <div className='flex flex-wrap content-start gap-x-5 gap-y-3 text-sm'>
          {settings?.phone && <a href={'tel:' + settings.phone}>{english ? 'Call' : 'اتصال'}</a>}
          {settings?.whatsapp && <a href={'https://wa.me/' + settings.whatsapp.replace(/\D/g, '')} target='_blank' rel='noreferrer'>{english ? 'WhatsApp' : 'واتساب'}</a>}
          {settings?.facebookUrl && <a href={settings.facebookUrl} target='_blank' rel='noreferrer'>Facebook</a>}
          {settings?.instagramUrl && <a href={settings.instagramUrl} target='_blank' rel='noreferrer'>Instagram</a>}
          {(english ? settings?.privacyPolicyEn : settings?.privacyPolicyAr) && (
            <Link href={english ? '/en/privacy' : '/privacy'}>{english ? 'Privacy' : 'الخصوصية'}</Link>
          )}
          {(english ? settings?.termsEn : settings?.termsAr) && (
            <Link href={english ? '/en/terms' : '/terms'}>{english ? 'Terms' : 'الشروط'}</Link>
          )}
          <Link href='/admin/login' className='basis-full pt-2 text-white/70'>
            {english ? 'Store administrator sign-in' : 'دخول إدارة المتجر'}
          </Link>
        </div>
      </div>
      <div className='container-shell mt-8 border-t border-white/20 pt-4 text-xs text-white/65'>
        © {new Date().getFullYear()} {english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}
      </div>
    </footer>
  );
}

