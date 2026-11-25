'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type AdminLocale = 'ar' | 'en';

type AdminLocaleContextValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
};

const AdminLocaleContext = createContext<AdminLocaleContextValue>({
  locale: 'ar',
  setLocale: () => undefined,
});

export function AdminLocaleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocaleState] = useState<AdminLocale>('ar');

  useEffect(() => {
    const saved = window.localStorage.getItem('admin-language');
    if (saved === 'en' || saved === 'ar') {
      const timer = window.setTimeout(() => setLocaleState(saved), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'ar-EG';
    document.documentElement.dir = locale === 'en' ? 'ltr' : 'rtl';
  }, [locale]);

  function setLocale(nextLocale: AdminLocale) {
    setLocaleState(nextLocale);
    window.localStorage.setItem('admin-language', nextLocale);
  }

  return (
    <AdminLocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  return useContext(AdminLocaleContext);
}

export function AdminBilingualText({ ar, en }: Readonly<{ ar: string; en: string }>) {
  const { locale } = useAdminLocale();
  return <>{locale === 'en' ? en : ar}</>;
}

export function AdminLanguageToggle() {
  const { locale, setLocale } = useAdminLocale();

  return (
    <button
      type='button'
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className='inline-flex min-h-10 items-center rounded-lg border border-[var(--line)] px-3 text-sm font-bold'
      aria-label={locale === 'en' ? 'Switch admin language to Arabic' : 'تغيير لغة الإدارة إلى الإنجليزية'}
    >
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
