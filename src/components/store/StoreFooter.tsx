import Link from 'next/link';

type FooterSettings = {
  phone?: string | null;
  whatsapp?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  privacyPolicyAr?: string | null;
  privacyPolicyEn?: string | null;
  termsAr?: string | null;
  termsEn?: string | null;
};

export function StoreFooter({ settings, locale = 'ar' }: { settings?: FooterSettings | null; locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const prefix = english ? '/en' : '';

  return (
    <footer className='mt-16 bg-[var(--brand-panel-bg)] py-10 text-white'>
      <div className='container-shell grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]'>
        <div>
          <p className='text-lg font-bold'>{english ? 'El Mohandeseen Olive Oil' : 'زيت زيتون المهندسين'}</p>
          <p className='mt-2 max-w-sm text-sm leading-7 text-white/75'>
            {english ? 'Browse the catalog and review your order details before checkout.' : 'تصفح الكتالوج وراجع تفاصيل طلبك قبل إتمامه.'}
          </p>
          <div className='mt-4 flex flex-wrap gap-4 text-sm text-white/80'>
            {settings?.facebookUrl && <a href={settings.facebookUrl} target='_blank' rel='noreferrer'>Facebook</a>}
            {settings?.instagramUrl && <a href={settings.instagramUrl} target='_blank' rel='noreferrer'>Instagram</a>}
          </div>
        </div>

        <nav className='grid content-start gap-3 text-sm' aria-label={english ? 'Store information' : 'معلومات المتجر'}>
          <h2 className='mb-1 font-bold text-white'>{english ? 'Store' : 'المتجر'}</h2>
          <Link href={prefix + '/about'} className='text-white/75 hover:text-white'>{english ? 'About' : 'عن المتجر'}</Link>
          <Link href={prefix + '/products'} className='text-white/75 hover:text-white'>{english ? 'Products' : 'المنتجات'}</Link>
          <Link href={prefix + '/how-to-order'} className='text-white/75 hover:text-white'>{english ? 'How to order' : 'طريقة الطلب'}</Link>
          <Link href={prefix + '/delivery'} className='text-white/75 hover:text-white'>{english ? 'Delivery' : 'التوصيل'}</Link>
          <Link href={prefix + '/faq'} className='text-white/75 hover:text-white'>{english ? 'Frequently asked questions' : 'الأسئلة الشائعة'}</Link>
        </nav>

        <div className='grid content-start gap-3 text-sm'>
          <h2 className='mb-1 font-bold'>{english ? 'Contact and policies' : 'التواصل والسياسات'}</h2>
          {settings?.phone && <a className='text-white/75 hover:text-white' href={'tel:' + settings.phone}>{english ? 'Call the store' : 'اتصل بالمتجر'}</a>}
          {settings?.whatsapp && <a className='text-white/75 hover:text-white' href={'https://wa.me/' + settings.whatsapp.replace(/\D/g, '')} target='_blank' rel='noreferrer'>{english ? 'Message on WhatsApp' : 'راسلنا على واتساب'}</a>}
          {(english ? settings?.privacyPolicyEn : settings?.privacyPolicyAr) && (
            <Link href={prefix + '/privacy'} className='text-white/75 hover:text-white'>{english ? 'Privacy policy' : 'سياسة الخصوصية'}</Link>
          )}
          {(english ? settings?.termsEn : settings?.termsAr) && (
            <Link href={prefix + '/terms'} className='text-white/75 hover:text-white'>{english ? 'Terms and conditions' : 'الشروط والأحكام'}</Link>
          )}
          <Link href='/admin/login' className='mt-2 text-xs text-white/60 hover:text-white'>
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
