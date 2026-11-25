import { notFound } from 'next/navigation';
import { prisma } from '@/backend/db';
import { StorePageShell } from '@/frontend/components/store/StorePageShell';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function EnglishPrivacyPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  if (!settings?.privacyPolicyEn) notFound();
  return (
    <StorePageShell locale='en' settings={settings}>
      <article className='container-shell max-w-3xl py-12'>
        <h1 className='text-3xl font-black text-[var(--olive-950)]'>Privacy policy</h1>
        <div className='mt-6 whitespace-pre-line text-[var(--muted)]'>{settings.privacyPolicyEn}</div>
      </article>
    </StorePageShell>
  );
}

