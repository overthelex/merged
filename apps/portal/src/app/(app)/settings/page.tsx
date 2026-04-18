import { eq } from 'drizzle-orm';
import { getDb, companies } from '@merged/db';
import { requireUser } from '@/lib/session';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Адміністратор',
  hr_manager: 'HR-менеджер',
};

export default async function SettingsPage() {
  const user = await requireUser();
  const db = getDb();

  const company = user.companyId
    ? (
        await db
          .select()
          .from(companies)
          .where(eq(companies.id, user.companyId))
          .limit(1)
      )[0] ?? null
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Налаштування
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Профіль, компанія, інтеграції.
        </p>
      </div>

      <div className="grid gap-5">
        <Card title="Профіль">
          <ProfileForm
            defaultName={user.name ?? ''}
            email={user.email}
            defaultContactEmail={user.contactEmail ?? user.email}
            defaultPhone={user.phone ?? ''}
          />
          <div className="mt-5 pt-5 border-t border-ink/5 flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-muted">Роль</div>
              <div className="text-sm text-ink mt-0.5">
                {ROLE_LABEL[user.role] ?? user.role}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-muted">User ID</div>
              <div className="text-xs font-mono text-ink-muted mt-0.5 tabular">
                {user.id}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Компанія">
          {company ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-ink-muted">Назва</dt>
              <dd className="text-ink font-medium">{company.name}</dd>
              <dt className="text-ink-muted">Slug</dt>
              <dd className="text-ink font-mono text-xs">{company.slug}</dd>
              <dt className="text-ink-muted">Створено</dt>
              <dd className="text-ink-muted tabular">
                {company.createdAt.toISOString().slice(0, 10)}
              </dd>
            </dl>
          ) : (
            <p className="text-sm text-ink-muted leading-relaxed">
              Компанію буде створено автоматично під час першої задачі. Після цього тут зʼявляться назва, slug і можливість перепривʼязки.
            </p>
          )}
        </Card>

        <Card title="GitHub App">
          <p className="text-sm text-ink-muted leading-relaxed">
            Портал працює через GitHub App <span className="font-mono">merged</span>, який створює форки в organization <span className="font-mono">imerged</span> (приватні, якщо вихідне репо приватне). Підключення App до компанії зʼявиться тут у наступній ітерації.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink/5 bg-surface shadow-card p-5">
      <h2 className="label-mono text-ink-muted mb-4">{title}</h2>
      {children}
    </section>
  );
}
