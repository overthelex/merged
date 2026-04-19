import { redirect } from 'next/navigation';
import Image from 'next/image';
import { requireUser } from '@/lib/session';
import { OnboardingForm } from './OnboardingForm';
import { getDb, companies } from '@merged/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardedAt) redirect('/');

  const db = getDb();
  const existingCompany = user.companyId
    ? (
        await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, user.companyId))
          .limit(1)
      )[0] ?? null
    : null;

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-8">
        <Image
          src="/brand/logo-ink-128.png"
          alt="merged"
          width={24}
          height={24}
          priority
        />
        <span className="font-display font-semibold tracking-tight text-ink">merged</span>
      </div>

      <div className="w-full max-w-md">
        <div className="label-mono text-ink-muted mb-3">Крок 1 з 1</div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink mb-2">
          Трохи про вас
        </h1>
        <p className="text-ink-muted text-sm mb-8 leading-relaxed">
          Вкажіть назву компанії та контакти — це допоможе правильно підписувати задачі та звʼязуватися з вами у випадку інцидентів.
        </p>

        <div className="rounded-xl border border-ink/5 bg-surface shadow-card p-5 sm:p-6">
          <OnboardingForm
            defaultCompanyName={existingCompany?.name ?? ''}
            defaultContactEmail={user.email}
            userEmail={user.email}
          />
        </div>
      </div>
    </main>
  );
}
