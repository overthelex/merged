import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { getDb, assignments, candidates, submissions } from '@merged/db';
import { requireUser } from '@/lib/session';
import { CopyButton } from './CopyButton';
import { DeleteButton } from './DeleteButton';
import { InviteCandidateForm } from './InviteCandidateForm';

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

  const [subs, invited, recentForHr] = await Promise.all([
    db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, row.id))
      .limit(20),
    db
      .select()
      .from(candidates)
      .where(eq(candidates.assignmentId, row.id))
      .orderBy(desc(candidates.invitedAt))
      .limit(20),
    db
      .select({ email: candidates.email, invitedAt: candidates.invitedAt })
      .from(candidates)
      .innerJoin(assignments, eq(candidates.assignmentId, assignments.id))
      .where(and(eq(assignments.hrUserId, user.id), isNotNull(candidates.email)))
      .orderBy(desc(candidates.invitedAt))
      .limit(200),
  ]);

  const emailSuggestions: string[] = [];
  {
    const seen = new Set<string>();
    for (const r of recentForHr) {
      if (!r.email || seen.has(r.email)) continue;
      seen.add(r.email);
      emailSuggestions.push(r.email);
      if (emailSuggestions.length >= 20) break;
    }
  }

  // PUBLIC_BASE_URL may be a comma-separated list (apex + portal host). Use
  // the first entry so the URL we render/copy is actually valid.
  const baseUrl =
    process.env.PUBLIC_BASE_URL?.split(',')[0]?.trim() ?? 'https://merged.com.ua';
  const inviteUrl = `${baseUrl}/invite/${row.shortId}/${row.inviteToken}`;

  return (
    <div>
      <Link href="/assignments" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">
        ← Усі задачі
      </Link>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="min-w-0">
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
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/assignments/${row.id}/edit`}
            className="h-9 inline-flex items-center px-3 rounded-md border border-ink/10 bg-surface text-ink text-sm hover:bg-surface-dim transition"
          >
            Редагувати
          </Link>
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
            Введіть e-mail кандидата — ми надішлемо фірмовий лист із посиланням. Посилання одноразово привʼязує GitHub-акаунт кандидата до форку.
          </p>
          <InviteCandidateForm id={row.id} emailSuggestions={emailSuggestions} />

          <div className="mt-5 pt-5 border-t border-ink/5">
            <div className="label-mono text-ink-muted mb-2">
              Посилання {row.sourceRepoPrivate ? '(потрібен access key)' : ''}
            </div>
            <div className="flex items-center gap-2 rounded-md border border-ink/10 bg-surface-dim px-3 py-2">
              <code className="flex-1 truncate font-mono text-xs text-ink">
                {inviteUrl}
              </code>
              <CopyButton value={inviteUrl} />
            </div>
            {row.expiresAt && (
              <p className="text-xs text-ink-muted mt-2 tabular">
                Дійсне до {row.expiresAt.toISOString().slice(0, 10)}
              </p>
            )}
          </div>

          {invited.length > 0 && (
            <div className="mt-5 pt-5 border-t border-ink/5">
              <div className="label-mono text-ink-muted mb-3">
                Історія запрошень
              </div>
              <ul className="divide-y divide-ink/5 text-sm">
                {invited.map((c) => (
                  <li
                    key={c.id}
                    className="py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-ink truncate">
                        {c.email ?? '—'}
                      </div>
                      {c.githubUsername && (
                        <div className="text-xs text-ink-muted truncate">
                          GitHub: @{c.githubUsername}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs tabular">
                      {c.acceptedAt ? (
                        <span className="text-emerald-700">
                          Прийняв · {c.acceptedAt.toISOString().slice(0, 10)}
                        </span>
                      ) : c.invitedAt ? (
                        <span className="text-ink-muted">
                          Надіслано · {c.invitedAt.toISOString().slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="Небезпечна зона">
          <p className="text-sm text-ink-muted mb-3 leading-relaxed">
            Видалення прибирає задачу з порталу і намагається видалити форк з organization{' '}
            <span className="font-mono">{row.forkOwner}</span>. Посилання для кандидата після цього перестане працювати.
          </p>
          <DeleteButton id={row.id} shortRepo={stripGithubPrefix(row.sourceRepoUrl)} />
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
