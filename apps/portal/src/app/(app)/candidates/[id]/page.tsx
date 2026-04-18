import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, candidates, assignments, submissions } from '@merged/db';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SENIORITY_LABEL: Record<string, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  architect: 'Architect',
};

const STATUS_LABEL: Record<string, string> = {
  pending_fork: 'Готуємо форк',
  pending_candidate: 'Очікує кандидата',
  in_progress: 'В роботі',
  submitted: 'Подано PR',
  scored: 'Оцінено',
  cancelled: 'Скасовано',
  expired: 'Прострочено',
};

export default async function CandidateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();

  const [row] = await db
    .select({
      candidate: candidates,
      assignment: assignments,
    })
    .from(candidates)
    .innerJoin(assignments, eq(candidates.assignmentId, assignments.id))
    .where(and(eq(candidates.id, id), eq(assignments.hrUserId, user.id)))
    .limit(1);

  if (!row) notFound();

  const { candidate, assignment } = row;

  const subs = await db
    .select()
    .from(submissions)
    .where(eq(submissions.candidateId, candidate.id))
    .orderBy(desc(submissions.createdAt))
    .limit(20);

  const displayName =
    candidate.githubUsername ? `@${candidate.githubUsername}` : candidate.email ?? 'Без імені';

  return (
    <div>
      <Link href="/candidates" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">
        ← Усі кандидати
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="label-mono text-ink-muted mb-2">Кандидат</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {displayName}
          </h1>
          {candidate.email && candidate.githubUsername && (
            <p className="text-ink-muted text-sm mt-1">{candidate.email}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        <Card title="Профіль">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="GitHub">
              {candidate.githubUsername ? (
                <a
                  href={`https://github.com/${candidate.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-ink hover:text-accent-dim transition"
                >
                  @{candidate.githubUsername}
                </a>
              ) : (
                <span className="text-ink-muted">—</span>
              )}
            </Field>
            <Field label="E-mail">
              {candidate.email ? (
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-ink hover:text-accent-dim transition"
                >
                  {candidate.email}
                </a>
              ) : (
                <span className="text-ink-muted">—</span>
              )}
            </Field>
            <Field label="Запрошено">
              <span className="tabular text-ink-muted">
                {formatDate(candidate.invitedAt)}
              </span>
            </Field>
            <Field label="Прийнято">
              <span className="tabular text-ink-muted">
                {formatDate(candidate.acceptedAt)}
              </span>
            </Field>
            <Field label="Створено">
              <span className="tabular text-ink-muted">
                {formatDate(candidate.createdAt)}
              </span>
            </Field>
          </dl>
        </Card>

        <Card title="Задача">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-ink mb-2">
                {stripGithubPrefix(assignment.sourceRepoUrl)}
              </p>
              <div className="flex items-center gap-2">
                <span className="label-mono text-accent-dim">
                  {SENIORITY_LABEL[assignment.seniority] ?? assignment.seniority}
                </span>
                <span className="text-ink-muted text-sm">·</span>
                <span className="text-ink-muted text-sm">
                  {STATUS_LABEL[assignment.status] ?? assignment.status}
                </span>
                <span className="text-ink-muted text-sm">·</span>
                <span className="font-mono text-xs text-ink-muted">
                  {assignment.shortId}
                </span>
              </div>
            </div>
            <Link
              href={`/assignments/${assignment.id}`}
              className="shrink-0 h-8 inline-flex items-center px-3 rounded-md border border-ink/10 bg-surface text-ink text-sm hover:bg-surface-dim transition"
            >
              Відкрити задачу →
            </Link>
          </div>
        </Card>

        <Card title="Сабміти">
          {subs.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Кандидат ще не відкрив pull request.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-ink-muted text-xs">
                <tr>
                  <th className="text-left font-medium py-2">PR</th>
                  <th className="text-left font-medium py-2">SHA</th>
                  <th className="text-left font-medium py-2">Оцінка</th>
                  <th className="text-left font-medium py-2">Дата</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-ink/5">
                    <td className="py-2 font-mono">#{s.prNumber}</td>
                    <td className="py-2 font-mono text-xs">
                      {s.prHeadSha.slice(0, 7)}
                    </td>
                    <td className="py-2 tabular">
                      {s.score != null ? `${s.score} / 100` : '—'}
                    </td>
                    <td className="py-2 text-ink-muted tabular">
                      {s.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink/5 bg-surface shadow-card p-5">
      <h2 className="label-mono text-ink-muted mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-mono text-ink-muted mb-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toISOString().slice(0, 10);
}

function stripGithubPrefix(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git\/?$/, '');
}
