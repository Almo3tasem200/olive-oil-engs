import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { StorePageShell } from '@/components/store/StorePageShell';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function PrivacyPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  if (!settings?.privacyPolicyAr) notFound();
  return (
    <StorePageShell settings={settings}>
      <article className='container-shell max-w-3xl py-12'>
        <h1 className='text-3xl font-black text-[var(--olive-950)]'>سياسة الخصوصية</h1>
        <div className='mt-6 whitespace-pre-line text-[var(--muted)]'>{settings.privacyPolicyAr}</div>
      </article>
    </StorePageShell>
  );
}

