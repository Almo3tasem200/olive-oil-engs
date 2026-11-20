'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Settings = {
  businessNameAr: string;
  businessNameEn: string;
  phone: string;
  whatsapp: string;
  facebookUrl: string;
  instagramUrl: string;
  publicAddressAr: string;
  publicAddressEn: string;
  hoursAr: string;
  hoursEn: string;
  deliveryPolicyAr: string;
  deliveryPolicyEn: string;
  privacyPolicyAr: string;
  privacyPolicyEn: string;
  termsAr: string;
  termsEn: string;
  codEnabled: boolean;
};

const blankSettings: Settings = {
  businessNameAr: 'زيت زيتون المهندسين', businessNameEn: 'El Mohandeseen Olive Oil',
  phone: '', whatsapp: '', facebookUrl: '', instagramUrl: '', publicAddressAr: '', publicAddressEn: '',
  hoursAr: '', hoursEn: '', deliveryPolicyAr: '', deliveryPolicyEn: '', privacyPolicyAr: '', privacyPolicyEn: '',
  termsAr: '', termsEn: '', codEnabled: false,
};

export function StoreSettingsAdmin() {
  const [settings, setSettings] = useState<Settings>(blankSettings);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل إعدادات المتجر.');
        if (data.settings) {
          const next: Settings = { ...blankSettings, ...data.settings };
          for (const key of Object.keys(next) as (keyof Settings)[]) {
            if (typeof next[key] !== 'boolean' && next[key] == null) (next as unknown as Record<string, unknown>)[key] = '';
          }
          setSettings(next);
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'تعذر تحميل إعدادات المتجر.'))
      .finally(() => setLoading(false));
    fetch('/api/storefront/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setLogoUrl(data.settings?.logoUrl || ''))
      .catch(() => undefined);
  }, []);

  function setField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ الإعدادات.');
      setMessage('تم حفظ إعدادات المتجر.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ الإعدادات.');
    } finally { setBusy(false); }
  }

  async function uploadLogo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!logoFile) return;
    setBusy(true); setError(''); setMessage('');
    const data = new FormData(); data.set('file', logoFile);
    try {
      const response = await fetch('/api/admin/settings/logo', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعذر رفع الشعار.');
      setLogoUrl(result.url as string); setLogoFile(null); setMessage('تم تحديث شعار المتجر.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر رفع الشعار.');
    } finally { setBusy(false); }
  }

  if (loading) return <section className='container-shell py-10'>جارٍ تحميل إعدادات المتجر…</section>;

  return (
    <section>
      <div><p className='text-sm font-bold text-[var(--olive-600)]'>إعدادات المالك</p><h1 className='text-3xl font-black text-[var(--olive-950)]'>بيانات المتجر وسياساته</h1></div>
      {error && <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      {message && <p className='mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-900' role='status'>{message}</p>}
      <div className='mt-5 grid gap-5 xl:grid-cols-[300px_1fr]'>
        <aside className='grid content-start gap-5'>
          <article className='card-surface p-5'>
            <h2 className='text-lg font-extrabold'>شعار المتجر</h2>
            {logoUrl && <div className='relative mt-4 h-40 overflow-hidden rounded-xl bg-[var(--cream-50)]'><Image src={logoUrl} alt='شعار المتجر الحالي' fill sizes='300px' className='object-contain p-4' /></div>}
            <form className='mt-4 grid gap-3' onSubmit={uploadLogo}>
              <label><span className='field-label'>اختر صورة شعار JPEG أو PNG أو WebP</span><input className='field-control' type='file' accept='image/jpeg,image/png,image/webp' required onChange={(event) => setLogoFile(event.target.files?.[0] || null)} /></label>
              <button className='btn-secondary' disabled={busy || !logoFile}>رفع الشعار</button>
            </form>
          </article>
          <article className='rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950'>
            <h2 className='font-extrabold'>تفعيل الدفع عند الاستلام</h2>
            <p className='mt-2 leading-6'>فعّل الطلب فقط بعد تأكيد إمكانية استقبال الطلبات وتحديد مناطق التوصيل والرسوم وسياسة التواصل مع العميل.</p>
          </article>
        </aside>

        <form className='grid gap-5' onSubmit={save}>
          <article className='card-surface p-5 sm:p-6'>
            <h2 className='text-xl font-extrabold'>البيانات العامة والتواصل</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <label><span className='field-label'>اسم المتجر بالعربية</span><input className='field-control' required maxLength={160} value={settings.businessNameAr} onChange={(event) => setField('businessNameAr', event.target.value)} /></label>
              <label><span className='field-label'>Store name in English</span><input className='field-control' required maxLength={160} dir='ltr' value={settings.businessNameEn} onChange={(event) => setField('businessNameEn', event.target.value)} /></label>
              <label><span className='field-label'>رقم الهاتف</span><input className='field-control' maxLength={32} dir='ltr' value={settings.phone} onChange={(event) => setField('phone', event.target.value)} /></label>
              <label><span className='field-label'>رقم WhatsApp</span><input className='field-control' maxLength={32} dir='ltr' value={settings.whatsapp} onChange={(event) => setField('whatsapp', event.target.value)} /></label>
              <label><span className='field-label'>رابط Facebook</span><input className='field-control' type='url' maxLength={500} dir='ltr' value={settings.facebookUrl} onChange={(event) => setField('facebookUrl', event.target.value)} /></label>
              <label><span className='field-label'>رابط Instagram</span><input className='field-control' type='url' maxLength={500} dir='ltr' value={settings.instagramUrl} onChange={(event) => setField('instagramUrl', event.target.value)} /></label>
              <label><span className='field-label'>العنوان العام بالعربية</span><textarea className='field-control min-h-20' maxLength={500} value={settings.publicAddressAr} onChange={(event) => setField('publicAddressAr', event.target.value)} /></label>
              <label><span className='field-label'>Public address in English</span><textarea className='field-control min-h-20' maxLength={500} dir='ltr' value={settings.publicAddressEn} onChange={(event) => setField('publicAddressEn', event.target.value)} /></label>
              <label><span className='field-label'>ساعات العمل بالعربية</span><input className='field-control' maxLength={500} value={settings.hoursAr} onChange={(event) => setField('hoursAr', event.target.value)} /></label>
              <label><span className='field-label'>Business hours in English</span><input className='field-control' maxLength={500} dir='ltr' value={settings.hoursEn} onChange={(event) => setField('hoursEn', event.target.value)} /></label>
            </div>
          </article>

          <article className='card-surface p-5 sm:p-6'>
            <h2 className='text-xl font-extrabold'>التوصيل والدفع</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <label><span className='field-label'>سياسة التوصيل بالعربية</span><textarea className='field-control min-h-28' maxLength={5000} value={settings.deliveryPolicyAr} onChange={(event) => setField('deliveryPolicyAr', event.target.value)} /></label>
              <label><span className='field-label'>Delivery policy in English</span><textarea className='field-control min-h-28' maxLength={5000} dir='ltr' value={settings.deliveryPolicyEn} onChange={(event) => setField('deliveryPolicyEn', event.target.value)} /></label>
            </div>
            <label className='mt-5 flex items-start gap-3 rounded-xl border border-[var(--line)] p-4'>
              <input className='mt-1' type='checkbox' checked={settings.codEnabled} onChange={(event) => setField('codEnabled', event.target.checked)} />
              <span><strong>تفعيل الدفع النقدي عند الاستلام</strong><span className='mt-1 block text-sm text-[var(--muted)]'>يتطلب إعداد منطقة توصيل فعالة واحدة على الأقل. إيقافه يمنع إرسال الطلبات الجديدة.</span></span>
            </label>
          </article>

          <article className='card-surface p-5 sm:p-6'>
            <h2 className='text-xl font-extrabold'>الشروط والخصوصية</h2>
            <p className='mt-2 text-sm text-[var(--muted)]'>أدخل النص المعتمد قبل إظهار صفحات السياسات للعميل.</p>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <label><span className='field-label'>سياسة الخصوصية بالعربية</span><textarea className='field-control min-h-36' maxLength={20000} value={settings.privacyPolicyAr} onChange={(event) => setField('privacyPolicyAr', event.target.value)} /></label>
              <label><span className='field-label'>Privacy policy in English</span><textarea className='field-control min-h-36' maxLength={20000} dir='ltr' value={settings.privacyPolicyEn} onChange={(event) => setField('privacyPolicyEn', event.target.value)} /></label>
              <label><span className='field-label'>الشروط والأحكام بالعربية</span><textarea className='field-control min-h-36' maxLength={20000} value={settings.termsAr} onChange={(event) => setField('termsAr', event.target.value)} /></label>
              <label><span className='field-label'>Terms and conditions in English</span><textarea className='field-control min-h-36' maxLength={20000} dir='ltr' value={settings.termsEn} onChange={(event) => setField('termsEn', event.target.value)} /></label>
            </div>
          </article>
          <button className='btn-primary justify-self-start' disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ إعدادات المتجر'}</button>
        </form>
      </div>
    </section>
  );
}
