import { prisma } from '@/lib/db';
import { formatEgp } from '@/lib/money';
import { StorePageShell } from '@/components/store/StorePageShell';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const [settings, zones] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ governorateAr: 'asc' }, { cityAr: 'asc' }, { areaAr: 'asc' }] }),
  ]);

  return (
    <StorePageShell settings={settings}>
      <section className='container-shell py-12'>
        <h1 className='text-3xl font-black text-[var(--olive-950)]'>التوصيل</h1>
        {settings?.deliveryPolicyAr && <p className='mt-4 max-w-3xl whitespace-pre-line text-[var(--muted)]'>{settings.deliveryPolicyAr}</p>}
        {zones.length ? (
          <div className='mt-8 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white'>
            <table className='w-full min-w-[520px] text-right'>
              <thead className='bg-[var(--olive-100)]'>
                <tr><th className='p-3'>المحافظة / المدينة</th><th className='p-3'>المنطقة</th><th className='p-3'>رسوم التوصيل</th></tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className='border-t border-[var(--line)]'>
                    <td className='p-3'>{zone.governorateAr} · {zone.cityAr}</td>
                    <td className='p-3'>{zone.areaAr}</td>
                    <td className='p-3 font-bold'>{formatEgp(zone.feePiasters, 'ar')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='mt-4 rounded-xl bg-amber-50 p-4 text-amber-900'>لم يعلن المتجر مناطق التوصيل ورسومها بعد.</p>
        )}
      </section>
    </StorePageShell>
  );
}

