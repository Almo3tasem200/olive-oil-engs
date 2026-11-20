'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatEgp, parseEgpToPiasters } from '@/lib/money';

type Role = 'OWNER' | 'MANAGER';
type ProductImage = { id: string; url: string; altAr: string; altEn: string; isPrimary: boolean };
type Product = {
  id: string;
  sku: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  shortDescriptionAr: string | null;
  shortDescriptionEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  volumeMl: number;
  packaging: 'DARK_PLASTIC_BOTTLE' | 'PLASTIC_JERRYCAN' | 'OTHER_PLASTIC';
  priceEgp: string;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  images: ProductImage[];
};

const packagingLabels: Record<Product['packaging'], string> = {
  DARK_PLASTIC_BOTTLE: 'عبوة بلاستيكية داكنة',
  PLASTIC_JERRYCAN: 'جركن بلاستيك',
  OTHER_PLASTIC: 'عبوة بلاستيكية أخرى',
};

export function ProductsAdmin({ role }: { role: Role }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selected = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0] ?? null,
    [products, selectedId],
  );

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/products', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تحميل المنتجات.');
    setProducts(data.products as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/products', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل المنتجات.');
        if (active) setProducts(data.products as Product[]);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'تعذر تحميل المنتجات.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function showProduct(id: string) {
    setSelectedId(id);
    setCreating(false);
  }

  async function reload(id?: string) {
    setError('');
    await load();
    if (id) setSelectedId(id);
    setCreating(false);
  }

  return (
    <section>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='text-sm font-bold text-[var(--olive-600)]'>الكتالوج</p>
          <h1 className='text-3xl font-black text-[var(--olive-950)]'>إدارة المنتجات</h1>
          <p className='mt-2 text-sm text-[var(--muted)]'>الأسعار تُحفظ بالقرش المصري وتظهر للعملاء بعد التحديث مباشرة.</p>
        </div>
        {role === 'OWNER' && (
          <button type='button' className='btn-primary' onClick={() => setCreating(true)}>إضافة منتج</button>
        )}
      </div>

      {error && <p className='mt-4 rounded-xl bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}

      <div className='mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]'>
        <aside className='card-surface overflow-hidden'>
          <h2 className='border-b border-[var(--line)] p-4 text-lg font-extrabold'>قائمة المنتجات ({products.length})</h2>
          {loading ? <p className='p-5 text-sm text-[var(--muted)]'>جارٍ التحميل…</p> : products.length ? (
            <ul className='divide-y divide-[var(--line)]'>
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type='button'
                    onClick={() => showProduct(product.id)}
                    className={'flex w-full items-center gap-3 p-4 text-right hover:bg-[var(--cream-50)] ' + (selected?.id === product.id && !creating ? 'bg-[var(--olive-100)]' : '')}
                    aria-current={selected?.id === product.id && !creating ? 'true' : undefined}
                  >
                    <span className='relative size-14 shrink-0 overflow-hidden rounded-lg bg-[var(--olive-100)]'>
                      {product.images[0] && <Image src={product.images.find((image) => image.isPrimary)?.url || product.images[0].url} alt='' fill sizes='56px' className='object-cover' />}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate font-bold'>{product.nameAr}</span>
                      <span className='mt-1 block text-xs text-[var(--muted)]'>{product.volumeMl} مل · {product.sku}</span>
                    </span>
                    <span className='shrink-0 text-left'>
                      <span className='block font-extrabold'>{formatEgp(parseEgpToPiasters(product.priceEgp))}</span>
                      <span className={'mt-1 block text-xs ' + (product.isActive ? 'text-green-800' : 'text-amber-800')}>
                        {product.isActive ? 'منشور' : 'مسودة'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className='p-5 text-sm text-[var(--muted)]'>لا توجد منتجات بعد. يضيف المالك المنتجات من هنا.</p>}
        </aside>

        <div className='min-w-0'>
          {creating && role === 'OWNER' ? (
            <ProductEditor key='new-product' role={role} onCancel={() => setCreating(false)} onSaved={(id) => void reload(id)} />
          ) : selected ? (
            <ProductEditor key={selected.id} role={role} product={selected} onSaved={(id) => void reload(id)} />
          ) : (
            <div className='card-surface p-6 text-sm text-[var(--muted)]'>اختر منتجًا من القائمة لعرض بياناته وتعديلها.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductEditor({
  product,
  role,
  onSaved,
  onCancel,
}: {
  product?: Product;
  role: Role;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [nameAr, setNameAr] = useState(product?.nameAr || '');
  const [nameEn, setNameEn] = useState(product?.nameEn || '');
  const [shortDescriptionAr, setShortDescriptionAr] = useState(product?.shortDescriptionAr || '');
  const [shortDescriptionEn, setShortDescriptionEn] = useState(product?.shortDescriptionEn || '');
  const [descriptionAr, setDescriptionAr] = useState(product?.descriptionAr || '');
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn || '');
  const [volumeMl, setVolumeMl] = useState(String(product?.volumeMl || ''));
  const [packaging, setPackaging] = useState<Product['packaging']>(product?.packaging || 'DARK_PLASTIC_BOTTLE');
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? false);
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [priceEgp, setPriceEgp] = useState(product?.priceEgp || '');
  const [priceReason, setPriceReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [altAr, setAltAr] = useState(product?.nameAr || '');
  const [altEn, setAltEn] = useState(product?.nameEn || '');
  const [makePrimary, setMakePrimary] = useState(!(product?.images.length));
  const [history, setHistory] = useState<{ id: string; oldPriceEgp: string; newPriceEgp: string; reason: string | null; createdAt: string; changedBy: { name: string } }[]>([]);

  useEffect(() => {
    if (role !== 'OWNER' || !product) return;
    fetch(`/api/admin/products/${product.id}/price/history`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHistory(data.history);
      })
      .catch(() => undefined);
  }, [product, role]);

  async function saveContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const content = {
      nameAr, nameEn, shortDescriptionAr, shortDescriptionEn, descriptionAr, descriptionEn,
      volumeMl: Number(volumeMl), packaging, isAvailable, isFeatured,
      isActive: product ? isActive : false,
    };
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : '/api/admin/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product ? content : {
          ...content,
          sku,
          slug,
          priceEgp,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ بيانات المنتج.');
      if (!product) {
        setMessage('أُضيف المنتج كمسودة. ارفع صورته الفعلية ثم حدّث بياناته للنشر.');
        onSaved(data.product.id as string);
      } else {
        setMessage('تم حفظ بيانات المنتج.');
        onSaved(product.id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر حفظ بيانات المنتج.');
    } finally {
      setBusy(false);
    }
  }

  async function savePrice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || role !== 'OWNER') return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/products/${product.id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceEgp, reason: priceReason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحديث السعر.');
      setPriceEgp(data.priceEgp as string);
      setPriceReason('');
      setMessage('تم تحديث السعر وتسجيل التغيير في سجل الأسعار.');
      onSaved(product.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحديث السعر.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !file) return;
    setBusy(true); setError(''); setMessage('');
    const form = new FormData();
    form.set('file', file);
    form.set('altAr', altAr);
    form.set('altEn', altEn);
    form.set('primary', String(makePrimary));
    try {
      const response = await fetch(`/api/admin/products/${product.id}/images`, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر رفع الصورة.');
      setFile(null);
      setMessage('تم رفع الصورة وتحويلها إلى WebP.');
      onSaved(product.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر رفع الصورة.');
    } finally {
      setBusy(false);
    }
  }

  async function imageAction(imageId: string, method: 'PATCH' | 'DELETE') {
    if (!product) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/products/${product.id}/images/${imageId}`, { method });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحديث الصور.');
      setMessage(method === 'DELETE' ? 'تم حذف الصورة.' : 'تم تعيين الصورة الرئيسية.');
      onSaved(product.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحديث الصور.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='grid gap-5'>
      <article className='card-surface p-5 sm:p-6'>
        <div className='mb-4 flex items-start justify-between gap-3'>
          <div>
            <p className='text-sm font-bold text-[var(--olive-600)]'>{product ? `SKU ${product.sku}` : 'منتج جديد'}</p>
            <h2 className='text-xl font-extrabold'>{product ? product.nameAr : 'إضافة منتج إلى الكتالوج'}</h2>
          </div>
          {onCancel && <button type='button' onClick={onCancel} className='btn-secondary'>إلغاء</button>}
        </div>
        {error && <p className='mb-3 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
        {message && <p className='mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-900' role='status'>{message}</p>}

        <form className='grid gap-4' onSubmit={saveContent}>
          {!product && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <label><span className='field-label'>رمز SKU</span><input className='field-control' required minLength={3} maxLength={80} pattern='[A-Za-z0-9_-]+' value={sku} onChange={(event) => setSku(event.target.value)} /></label>
              <label><span className='field-label'>الرابط المختصر بالإنجليزية</span><input className='field-control' required minLength={3} maxLength={120} pattern='[a-z0-9-]+' value={slug} onChange={(event) => setSlug(event.target.value)} /></label>
            </div>
          )}
          <div className='grid gap-4 sm:grid-cols-2'>
            <label><span className='field-label'>اسم المنتج بالعربية</span><input className='field-control' required maxLength={160} value={nameAr} onChange={(event) => setNameAr(event.target.value)} /></label>
            <label><span className='field-label'>Product name in English</span><input className='field-control' required maxLength={160} dir='ltr' value={nameEn} onChange={(event) => setNameEn(event.target.value)} /></label>
            <label><span className='field-label'>وصف قصير بالعربية</span><input className='field-control' maxLength={300} value={shortDescriptionAr} onChange={(event) => setShortDescriptionAr(event.target.value)} /></label>
            <label><span className='field-label'>Short description in English</span><input className='field-control' maxLength={300} dir='ltr' value={shortDescriptionEn} onChange={(event) => setShortDescriptionEn(event.target.value)} /></label>
            <label className='sm:col-span-2'><span className='field-label'>الوصف الكامل بالعربية</span><textarea className='field-control min-h-24' maxLength={5000} value={descriptionAr} onChange={(event) => setDescriptionAr(event.target.value)} /></label>
            <label className='sm:col-span-2'><span className='field-label'>Full description in English</span><textarea className='field-control min-h-24' maxLength={5000} dir='ltr' value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} /></label>
            <label><span className='field-label'>الحجم بالملليلتر</span><input className='field-control' type='number' min={1} max={100000} step={1} required value={volumeMl} onChange={(event) => setVolumeMl(event.target.value)} /></label>
            <label><span className='field-label'>نوع العبوة</span><select className='field-control' value={packaging} onChange={(event) => setPackaging(event.target.value as Product['packaging'])}>{Object.entries(packagingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <div className='flex flex-wrap gap-x-5 gap-y-2 text-sm'>
            <label className='inline-flex items-center gap-2'><input type='checkbox' checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} />متاح للبيع</label>
            <label className='inline-flex items-center gap-2'><input type='checkbox' checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />منتج مميز</label>
            {product && <label className='inline-flex items-center gap-2'><input type='checkbox' checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />منشور في المتجر</label>}
          </div>
          {product && !product.images.length && <p className='rounded-lg bg-amber-50 p-3 text-sm text-amber-900'>أضف صورة حقيقية للعبوة قبل نشر المنتج. لا تظهر المسودات للعملاء.</p>}
          {!product && role === 'OWNER' && (
            <label><span className='field-label'>السعر الابتدائي بالجنيه المصري</span><input className='field-control' type='text' inputMode='decimal' pattern='[0-9]+(\.[0-9]{1,2})?' required value={priceEgp} onChange={(event) => setPriceEgp(event.target.value)} /></label>
          )}
          <button className='btn-primary justify-self-start' disabled={busy}>{busy ? 'جارٍ الحفظ…' : product ? 'حفظ بيانات المنتج' : 'إنشاء كمسودة'}</button>
        </form>
      </article>

      {product && (
        <>
          <article className='card-surface p-5 sm:p-6'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div><h2 className='text-xl font-extrabold'>السعر</h2><p className='mt-1 text-sm text-[var(--muted)]'>السعر الحالي: <strong className='text-[var(--olive-950)]'>{formatEgp(parseEgpToPiasters(product.priceEgp))}</strong></p></div>
              {role !== 'OWNER' && <span className='rounded-lg bg-[var(--olive-100)] px-3 py-2 text-xs font-bold'>تعديل السعر متاح للمالك فقط</span>}
            </div>
            {role === 'OWNER' ? (
              <>
                <form className='mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]' onSubmit={savePrice}>
                  <label><span className='field-label'>السعر الجديد (جنيه)</span><input className='field-control' type='text' inputMode='decimal' pattern='[0-9]+(\.[0-9]{1,2})?' required value={priceEgp} onChange={(event) => setPriceEgp(event.target.value)} /></label>
                  <label><span className='field-label'>سبب التغيير لتوثيق السجل</span><input className='field-control' required minLength={3} maxLength={300} value={priceReason} onChange={(event) => setPriceReason(event.target.value)} placeholder='مثال: تحديث قائمة الأسعار' /></label>
                  <button className='btn-primary self-end' disabled={busy}>حفظ السعر</button>
                </form>
                <div className='mt-5 border-t border-[var(--line)] pt-4'>
                  <h3 className='font-bold'>سجل تغييرات السعر</h3>
                  {history.length ? <ul className='mt-3 divide-y divide-[var(--line)] text-sm'>{history.map((entry) => <li key={entry.id} className='flex flex-wrap justify-between gap-2 py-2'><span>{entry.reason || 'دون سبب'} · <bdi dir='ltr'>{formatEgp(parseEgpToPiasters(entry.oldPriceEgp))} → {formatEgp(parseEgpToPiasters(entry.newPriceEgp))}</bdi></span><span className='text-[var(--muted)]'>{entry.changedBy.name} · {new Date(entry.createdAt).toLocaleDateString('ar-EG')}</span></li>)}</ul> : <p className='mt-2 text-sm text-[var(--muted)]'>لا توجد تغييرات مسجلة.</p>}
                </div>
              </>
            ) : <p className='mt-3 text-sm text-[var(--muted)]'>لا يمكن لهذا الحساب تعديل السعر. ترسل التغييرات إلى سجل الأسعار بعملية مالك معتمدة.</p>}
          </article>

          <article className='card-surface p-5 sm:p-6'>
            <h2 className='text-xl font-extrabold'>صور المنتج</h2>
            <p className='mt-1 text-sm text-[var(--muted)]'>ارفع صور العبوة الفعلية؛ تُحسّن إلى WebP عند التخزين.</p>
            {product.images.length ? (
              <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
                {product.images.map((image) => (
                  <div key={image.id} className='overflow-hidden rounded-xl border border-[var(--line)]'>
                    <div className='relative aspect-square bg-[var(--cream-50)]'><Image src={image.url} alt={image.altAr} fill sizes='(max-width: 640px) 50vw, 220px' className='object-cover' /></div>
                    <div className='grid gap-2 p-2'>
                      <span className='text-xs font-bold'>{image.isPrimary ? 'الصورة الرئيسية' : 'صورة إضافية'}</span>
                      {!image.isPrimary && <button type='button' className='btn-secondary min-h-9 px-2 text-xs' disabled={busy} onClick={() => void imageAction(image.id, 'PATCH')}>تعيين كرئيسية</button>}
                      <button type='button' className='min-h-9 rounded-lg border border-red-200 px-2 text-xs font-bold text-red-800' disabled={busy} onClick={() => void imageAction(image.id, 'DELETE')}>حذف الصورة</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className='mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900'>أضف صورة فعلية قبل نشر هذا المنتج.</p>}
            <form className='mt-5 grid gap-3 border-t border-[var(--line)] pt-4' onSubmit={uploadImage}>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label><span className='field-label'>نص بديل بالعربية</span><input className='field-control' required maxLength={200} value={altAr} onChange={(event) => setAltAr(event.target.value)} /></label>
                <label><span className='field-label'>Alt text in English</span><input className='field-control' required maxLength={200} dir='ltr' value={altEn} onChange={(event) => setAltEn(event.target.value)} /></label>
              </div>
              <label><span className='field-label'>صورة JPEG أو PNG أو WebP (حتى 12 ميجابايت)</span><input className='field-control' type='file' accept='image/jpeg,image/png,image/webp' required onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
              <label className='inline-flex items-center gap-2 text-sm'><input type='checkbox' checked={makePrimary} onChange={(event) => setMakePrimary(event.target.checked)} />اجعلها الصورة الرئيسية</label>
              <button className='btn-secondary justify-self-start' disabled={busy || !file}>رفع الصورة</button>
            </form>
          </article>
        </>
      )}
    </div>
  );
}
