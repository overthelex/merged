import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { getDb, assignments, submissions } from '@merged/db';
import { requireUser } from '@/lib/session';
import { CopyButton } from './CopyButton';

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

export default async function AssignmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();

  const [row] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.hrUserId, user.id)))
    .limit(1);

  if (!row) notFound();

  const subs = await db
    .select()
    .from(submissions)
    .where(eq(submissions.assignmentId, row.id))
    .limit(20);

  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://merged.com.ua';
  const inviteUrl = `${baseUrl}/invite/${row.shortId}/${row.inviteToken}`;

  return (
    <div>
      <Link href="/" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">
        ← Усі задачі
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="label-mono text-ink-muted mb-2">
            Задача · {row.shortId}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {stripGithubPrefix(row.sourceRepoUrl)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="label-mono text-accent-dim">
              {SENIORITY_LABEL[row.seniority] ?? row.seniority}
            </span>
            <span className="text-ink-muted text-sm">·</span>
            <span className="text-ink-muted text-sm">
              {STATUS_LABEL[row.status] ?? row.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <Card title="Форк репозиторію">
          {row.forkUrl ? (
            <>
              <p className="text-sm text-ink-muted mb-3 leading-relaxed">
                Приватний форк створено в organization{' '}
                <span className="font-mono">{row.forkOwner}</span>. Кандидат отримає
                права outside collaborator та зможе надсилати PR проти{' '}
                <span className="font-mono">main</span>.
              </p>
              <div className="flex items-center gap-2 rounded-md border border-ink/10 bg-surface-dim px-3 py-2">
                <code className="flex-1 truncate font-mono text-xs text-ink">
                  {row.forkUrl}
                </code>
                <CopyButton value={row.forkUrl} />
              </div>
              <p className="text-xs text-ink-muted mt-3">
                Примітка: фактичне створення форку через GitHub App додається у наступній ітерації — наразі URL зарезервовано.
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Форк ще не створено.</p>
          )}
        </Card>

        <Card title="Запрошення для кандидата">
          <p className="text-sm text-ink-muted mb-3 leading-relaxed">
            Надішліть це посилання разом із access key (якщо репо приватне) на e-mail кандидата. Посилання одноразово привʼязує GitHub-акаунт кандидата до форку.
          </p>
          <div className="flex items-center gap-2 rounded-md border border-ink/10 bg-surface-dim px-3 py-2">
            <code className="flex-1 truncate font-mono text-xs text-ink">
              {inviteUrl}
            </code>
            <CopyButton value={inviteUrl} />
          </div>
          {row.expiresAt && (
            <p className="text-xs text-ink-muted mt-3 tabular">
              Дійсне до {row.expiresAt.toISOString().slice(0, 10)}
            </p>
          )}
        </Card>

        <Card title="Сабміти">
          {subs.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Кандидат ще не відкрив pull request. Щойно PR зʼявиться — сабміт і оцінка відобразяться тут.
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

function stripGithubPrefix(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git\/?$/, '');
}
