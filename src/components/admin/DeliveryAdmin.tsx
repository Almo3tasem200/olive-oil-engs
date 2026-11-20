'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Zone = {
  id: string;
  code: string;
  governorateAr: string;
  governorateEn: string;
  cityAr: string;
  cityEn: string;
  areaAr: string;
  areaEn: string;
  feeEgp: string;
  freeDeliveryOverEgp: string;
  isActive: boolean;
};

const emptyZone = (): Omit<Zone, 'id'> => ({
  code: '', governorateAr: '', governorateEn: '', cityAr: '', cityEn: '', areaAr: '', areaEn: '',
  feeEgp: '0.00', freeDeliveryOverEgp: '', isActive: false,
});

export function DeliveryAdmin() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<Omit<Zone, 'id'>>(emptyZone());
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const selected = useMemo(() => zones.find((zone) => zone.id === selectedId) || null, [zones, selectedId]);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/delivery-zones', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تحميل مناطق التوصيل.');
    setZones(data.zones as Zone[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/delivery-zones', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل مناطق التوصيل.');
        if (active) setZones(data.zones as Zone[]);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'تعذر تحميل مناطق التوصيل.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function selectZone(zone: Zone) {
    setSelectedId(zone.id);
    setCreating(false);
    setForm({
      code: zone.code,
      governorateAr: zone.governorateAr,
      governorateEn: zone.governorateEn,
      cityAr: zone.cityAr,
      cityEn: zone.cityEn,
      areaAr: zone.areaAr,
      areaEn: zone.areaEn,
      feeEgp: zone.feeEgp,
      freeDeliveryOverEgp: zone.freeDeliveryOverEgp,
      isActive: zone.isActive,
    });
    setError(''); setMessage('');
  }

  function newZone() {
    setSelectedId(''); setCreating(true); setForm(emptyZone()); setError(''); setMessage('');
  }

  function setField<K extends keyof Omit<Zone, 'id'>>(key: K, value: Omit<Zone, 'id'>[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const url = creating ? '/api/admin/delivery-zones' : `/api/admin/delivery-zones/${selectedId}`;
      const response = await fetch(url, {
        method: creating ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ منطقة التوصيل.');
      await load();
      if (creating && data.id) setSelectedId(data.id as string);
      setCreating(false); setMessage('تم حفظ منطقة التوصيل.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ منطقة التوصيل.');
    } finally { setBusy(false); }
  }

  return (
    <section>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div><p className='text-sm font-bold text-[var(--olive-600)]'>الإعدادات التشغيلية</p><h1 className='text-3xl font-black text-[var(--olive-950)]'>مناطق ورسوم التوصيل</h1></div>
        <button type='button' className='btn-primary' onClick={newZone}>إضافة منطقة</button>
      </div>
      <p className='mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900'>تُحسب الرسوم من المنطقة المختارة على الخادم. تبقى المنطقة غير متاحة للعملاء حتى تفعيلها بعد تأكيد التغطية والسعر.</p>
      {error && <p className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      {message && <p className='mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-900' role='status'>{message}</p>}
      <div className='mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'>
        <aside className='card-surface overflow-hidden'>
          <h2 className='border-b border-[var(--line)] p-4 font-extrabold'>مناطق التوصيل</h2>
          {loading ? <p className='p-4 text-sm text-[var(--muted)]'>جارٍ التحميل…</p> : zones.length ? (
            <ul className='divide-y divide-[var(--line)]'>{zones.map((zone) => (
              <li key={zone.id}><button type='button' onClick={() => selectZone(zone)} className={'w-full p-4 text-right hover:bg-[var(--cream-50)] ' + (selectedId === zone.id ? 'bg-[var(--olive-100)]' : '')}>
                <span className='flex items-center justify-between gap-3'><strong>{zone.areaAr}</strong><span className='text-sm font-bold'>{zone.feeEgp} ج.م</span></span>
                <span className='mt-1 block text-xs text-[var(--muted)]'>{zone.governorateAr} · {zone.cityAr} · {zone.code} · {zone.isActive ? 'فعالة' : 'متوقفة'}</span>
              </button></li>
            ))}</ul>
          ) : <p className='p-4 text-sm text-[var(--muted)]'>لا توجد مناطق. أضف منطقة بعد الاتفاق على التغطية والرسوم.</p>}
        </aside>
        <article className='card-surface p-5 sm:p-6'>
          {creating || selected ? <>
            <h2 className='text-xl font-extrabold'>{creating ? 'منطقة جديدة' : `تعديل: ${selected?.areaAr}`}</h2>
            <form className='mt-4 grid gap-4' onSubmit={save}>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label><span className='field-label'>رمز المنطقة</span><input className='field-control' required minLength={2} maxLength={100} pattern='[A-Za-z0-9_-]+' value={form.code} onChange={(event) => setField('code', event.target.value)} /></label>
                <label><span className='field-label'>رسوم التوصيل بالجنيه</span><input className='field-control' required inputMode='decimal' pattern='[0-9]+(\.[0-9]{1,2})?' value={form.feeEgp} onChange={(event) => setField('feeEgp', event.target.value)} /></label>
                <label><span className='field-label'>المحافظة بالعربية</span><input className='field-control' required maxLength={120} value={form.governorateAr} onChange={(event) => setField('governorateAr', event.target.value)} /></label>
                <label><span className='field-label'>Governorate in English</span><input className='field-control' required maxLength={120} dir='ltr' value={form.governorateEn} onChange={(event) => setField('governorateEn', event.target.value)} /></label>
                <label><span className='field-label'>المدينة بالعربية</span><input className='field-control' required maxLength={120} value={form.cityAr} onChange={(event) => setField('cityAr', event.target.value)} /></label>
                <label><span className='field-label'>City in English</span><input className='field-control' required maxLength={120} dir='ltr' value={form.cityEn} onChange={(event) => setField('cityEn', event.target.value)} /></label>
                <label><span className='field-label'>المنطقة بالعربية</span><input className='field-control' required maxLength={120} value={form.areaAr} onChange={(event) => setField('areaAr', event.target.value)} /></label>
                <label><span className='field-label'>Area in English</span><input className='field-control' required maxLength={120} dir='ltr' value={form.areaEn} onChange={(event) => setField('areaEn', event.target.value)} /></label>
                <label className='sm:col-span-2'><span className='field-label'>حد الطلب للتوصيل المجاني (اختياري)</span><input className='field-control' inputMode='decimal' pattern='([0-9]+(\.[0-9]{1,2})?)?' value={form.freeDeliveryOverEgp} onChange={(event) => setField('freeDeliveryOverEgp', event.target.value)} placeholder='اتركه فارغًا إذا لم يتوفر' /></label>
              </div>
              <label className='inline-flex items-center gap-2 text-sm'><input type='checkbox' checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} />متاحة للعملاء عند إتمام الطلب</label>
              <button className='btn-primary justify-self-start' disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ المنطقة'}</button>
            </form>
          </> : <p className='text-sm text-[var(--muted)]'>اختر منطقة لتعديلها أو أضف منطقة جديدة.</p>}
        </article>
      </div>
    </section>
  );
}
