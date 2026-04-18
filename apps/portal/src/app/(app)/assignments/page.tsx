import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb, assignments } from '@merged/db';
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

export default async function AssignmentsPage() {
  const user = await requireUser();
  const db = getDb();
  const rows = await db
    .select()
    .from(assignments)
    .where(eq(assignments.hrUserId, user.id))
    .orderBy(desc(assignments.createdAt))
    .limit(50);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Задачі
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Створюйте калібровані задачі на реальному репо компанії та надсилайте запрошення кандидатам.
          </p>
        </div>
        <Link
          href="/assignments/new"
          className="h-10 inline-flex items-center px-4 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition"
        >
          + Нова задача
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-ink/5 bg-surface overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-dim text-ink-muted">
              <tr>
                <th className="text-left font-medium px-4 py-3">Репо</th>
                <th className="text-left font-medium px-4 py-3">Рівень</th>
                <th className="text-left font-medium px-4 py-3">Статус</th>
                <th className="text-left font-medium px-4 py-3">Створено</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-ink/5 hover:bg-surface-dim/50 transition"
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {stripGithubPrefix(a.sourceRepoUrl)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="label-mono text-accent-dim">
                      {SENIORITY_LABEL[a.seniority] ?? a.seniority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {STATUS_LABEL[a.status] ?? a.status}
                  </td>
                  <td className="px-4 py-3 text-ink-muted tabular">
                    {a.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/assignments/${a.id}`}
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
        Ще немає жодної задачі
      </h2>
      <p className="text-ink-muted max-w-md mx-auto mb-6">
        Додайте URL репо компанії, яку ви представляєте, і рівень позиції — ми підготуємо форк і посилання для кандидата.
      </p>
      <Link
        href="/assignments/new"
        className="h-10 inline-flex items-center px-4 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition"
      >
        Створити першу задачу
      </Link>
    </div>
  );
}

function stripGithubPrefix(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git\/?$/, '');
}
