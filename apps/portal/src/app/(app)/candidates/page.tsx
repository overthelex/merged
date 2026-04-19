import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb, candidates, assignments } from '@merged/db';
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

export default async function CandidatesPage() {
  const user = await requireUser();
  const db = getDb();

  const rows = await db
    .select({
      candidateId: candidates.id,
      email: candidates.email,
      githubUsername: candidates.githubUsername,
      invitedAt: candidates.invitedAt,
      acceptedAt: candidates.acceptedAt,
      candidateCreatedAt: candidates.createdAt,
      assignmentId: assignments.id,
      shortId: assignments.shortId,
      sourceRepoUrl: assignments.sourceRepoUrl,
      seniority: assignments.seniority,
      status: assignments.status,
    })
    .from(candidates)
    .innerJoin(assignments, eq(candidates.assignmentId, assignments.id))
    .where(eq(assignments.hrUserId, user.id))
    .orderBy(desc(candidates.createdAt))
    .limit(100);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Кандидати
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Усі кандидати, які прийняли запрошення на ваші задачі.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="-mx-4 sm:mx-0 rounded-none sm:rounded-xl border-y sm:border border-ink/5 bg-surface overflow-x-auto shadow-card">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-surface-dim text-ink-muted">
              <tr>
                <th className="text-left font-medium px-4 py-3">Кандидат</th>
                <th className="text-left font-medium px-4 py-3">Задача</th>
                <th className="text-left font-medium px-4 py-3">Рівень</th>
                <th className="text-left font-medium px-4 py-3">Статус</th>
                <th className="text-left font-medium px-4 py-3">Додано</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.candidateId}
                  className="border-t border-ink/5 hover:bg-surface-dim/50 transition"
                >
                  <td className="px-4 py-3 min-w-0">
                    <Link
                      href={`/candidates/${c.candidateId}`}
                      className="flex flex-col hover:text-accent-dim transition min-w-0"
                    >
                      {c.githubUsername ? (
                        <span className="font-mono text-xs text-ink break-all">
                          @{c.githubUsername}
                        </span>
                      ) : (
                        <span className="text-ink-muted text-xs italic">
                          без GitHub
                        </span>
                      )}
                      {c.email && (
                        <span className="text-ink-muted text-xs mt-0.5 break-all">
                          {c.email}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {stripGithubPrefix(c.sourceRepoUrl)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="label-mono text-accent-dim">
                      {SENIORITY_LABEL[c.seniority] ?? c.seniority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {STATUS_LABEL[c.status] ?? c.status}
                  </td>
                  <td className="px-4 py-3 text-ink-muted tabular">
                    {c.candidateCreatedAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/candidates/${c.candidateId}`}
                      className="text-ink hover:text-accent-dim transition"
                    >
                      Відкрити →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-ink/15 bg-surface/50 px-8 py-16 text-center">
      <div className="label-mono text-ink-muted mb-3">Порожньо</div>
      <h2 className="font-display text-xl font-semibold text-ink mb-2">
        Ще немає кандидатів
      </h2>
      <p className="text-ink-muted max-w-md mx-auto mb-6">
        Створіть задачу та надішліть запрошення — коли кандидат прийме його, він зʼявиться тут.
      </p>
      <Link
        href="/assignments/new"
        className="h-10 inline-flex items-center px-4 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition"
      >
        Створити задачу
      </Link>
    </div>
  );
}

function stripGithubPrefix(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git\/?$/, '');
}
