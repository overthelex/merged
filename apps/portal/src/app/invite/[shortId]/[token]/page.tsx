import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { getDb, assignments, candidates } from '@merged/db';
import { AcceptForm } from './AcceptForm';
import { acceptInvite } from './actions';

export const dynamic = 'force-dynamic';

const SENIORITY_LABEL: Record<string, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  architect: 'Architect',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ shortId: string; token: string }>;
}) {
  const { shortId, token } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.shortId, shortId), eq(assignments.inviteToken, token)))
    .limit(1);

  if (!row) notFound();

  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return <Expired />;
  }

  const [existing] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.assignmentId, row.id))
    .limit(1);

  const level = SENIORITY_LABEL[row.seniority] ?? row.seniority;

  return (
    <main className="min-h-screen bg-paper text-ink py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="label-mono text-ink-muted mb-2">merged · assessment</div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          Вас запрошено на калібровану задачу
        </h1>
        <p className="text-ink-muted mb-8">
          Рівень: <strong className="text-ink">{level}</strong> · Assignment{' '}
          <code className="font-mono text-sm break-all">{row.shortId}</code>
        </p>

        {existing ? (
          <Accepted forkUrl={row.forkUrl} githubUsername={existing.githubUsername} />
        ) : (
          <AcceptForm
            shortId={row.shortId}
            token={token}
            forkUrl={row.forkUrl}
            action={acceptInvite}
          />
        )}

        <hr className="my-10 border-ink/10" />

        <section className="prose prose-sm max-w-none">
          <h2 className="font-display text-xl font-semibold">Як це працює</h2>
          <ol>
            <li>Введіть ваш GitHub username нижче. Ми додамо вас як outside collaborator на приватний форк репо компанії.</li>
            <li>Клонуйте форк, працюйте в окремій гілці. Прямі коміти в <code>main</code> заблоковані.</li>
            <li>Відкрийте pull request проти <code>main</code>. Після відкриття PR ми автоматично запустимо перевірки й оцінку.</li>
            <li>Інструменти — на ваш вибір (IDE, Cursor, Claude Code, Codex). AI дозволений.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function Accepted({
  forkUrl,
  githubUsername,
}: {
  forkUrl: string | null;
  githubUsername: string | null;
}) {
  return (
    <div className="rounded-xl border border-ink/5 bg-surface p-5 shadow-card">
      <div className="label-mono text-accent-dim mb-2">запрошення вже прийнято</div>
      <p className="text-sm text-ink mb-3">
        GitHub: <code className="font-mono">{githubUsername ?? '—'}</code>
      </p>
      {forkUrl && (
        <a
          href={forkUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center px-4 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft"
        >
          Відкрити форк →
        </a>
      )}
    </div>
  );
}

function Expired() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="label-mono text-ink-muted mb-2">merged</div>
        <h1 className="font-display text-2xl font-semibold mb-2">Посилання прострочене</h1>
        <p className="text-ink-muted text-sm">
          Термін запрошення сплив. Звʼяжіться з рекрутером для нового.
        </p>
      </div>
    </main>
  );
}
