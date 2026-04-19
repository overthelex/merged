import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb, submissions, assignments, candidates } from '@merged/db';
import { AppealForm } from './AppealForm';
import { submitAppeal } from './actions';

export const dynamic = 'force-dynamic';

const SENIORITY_LABEL: Record<string, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  architect: 'Architect',
};

export default async function AppealPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = getDb();

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.appealToken, token))
    .limit(1);

  if (!submission) notFound();

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, submission.assignmentId))
    .limit(1);

  if (!assignment) notFound();

  const candidate = submission.candidateId
    ? (
        await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, submission.candidateId))
          .limit(1)
      )[0] ?? null
    : null;

  const level = SENIORITY_LABEL[assignment.seniority] ?? assignment.seniority;

  if (submission.appealStatus !== 'none') {
    return (
      <AlreadySubmitted
        shortId={assignment.shortId}
        level={level}
        score={submission.score}
      />
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="label-mono text-ink-muted mb-2">merged · апеляція</div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          Не згодні з оцінкою?
        </h1>
        <p className="text-ink-muted mb-6">
          Задача <code className="font-mono text-sm break-all">{assignment.shortId}</code> · Рівень{' '}
          <strong className="text-ink">{level}</strong> · Оцінка{' '}
          <strong className="text-ink">{submission.score ?? '—'}/100</strong>
        </p>

        <AppealForm
          token={token}
          githubUsername={candidate?.githubUsername ?? null}
          action={submitAppeal}
        />

        <hr className="my-10 border-ink/10" />

        <section className="prose prose-sm max-w-none">
          <h2 className="font-display text-xl font-semibold">Що буде далі</h2>
          <ol>
            <li>Ми надішлемо рекрутеру ваше пояснення разом із поточною оцінкою.</li>
            <li>
              Задача автоматично повернеться у статус <code>in progress</code> — ви зможете
              відкрити новий PR у тому ж форку.
            </li>
            <li>
              Після нового PR запуститься повторне автоматичне оцінювання. Подати апеляцію
              можна лише раз на цю оцінку.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function AlreadySubmitted({
  shortId,
  level,
  score,
}: {
  shortId: string;
  level: string;
  score: number | null;
}) {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="label-mono text-ink-muted mb-2">merged · апеляція</div>
        <h1 className="font-display text-2xl font-semibold mb-2">
          Апеляцію вже отримано
        </h1>
        <p className="text-ink-muted text-sm">
          По задачі <code className="font-mono break-all">{shortId}</code> ({level}, оцінка{' '}
          {score ?? '—'}/100) апеляцію подано. Повторно скористатися цим посиланням не можна —
          відкрийте новий PR у вашому форку.
        </p>
      </div>
    </main>
  );
}
