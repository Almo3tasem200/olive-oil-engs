import { prisma } from '@/lib/db';
import { formatEgp } from '@/lib/money';
import { StorePageShell } from '@/components/store/StorePageShell';

export const dynamic = 'force-dynamic';

export default async function EnglishDeliveryPage() {
  const [settings, zones] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ governorateEn: 'asc' }, { cityEn: 'asc' }, { areaEn: 'asc' }] }),
  ]);

  return (
    <StorePageShell locale='en' settings={settings}>
      <section className='container-shell py-12'>
        <h1 className='text-3xl font-black text-[var(--olive-950)]'>Delivery</h1>
        {settings?.deliveryPolicyEn && <p className='mt-4 max-w-3xl whitespace-pre-line text-[var(--muted)]'>{settings.deliveryPolicyEn}</p>}
        {zones.length ? (
          <div className='mt-8 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white'>
            <table className='w-full min-w-[520px] text-left'>
              <thead className='bg-[var(--olive-100)]'>
                <tr><th className='p-3'>Governorate / city</th><th className='p-3'>Area</th><th className='p-3'>Delivery fee</th></tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className='border-t border-[var(--line)]'>
                    <td className='p-3'>{zone.governorateEn} · {zone.cityEn}</td>
                    <td className='p-3'>{zone.areaEn}</td>
                    <td className='p-3 font-bold'>{formatEgp(zone.feePiasters, 'en')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='mt-4 rounded-xl bg-amber-50 p-4 text-amber-900'>The store has not published delivery areas and fees yet.</p>
        )}
      </section>
    </StorePageShell>
  );
}

