import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { getDb, assignments } from '@merged/db';
import { requireUser } from '@/lib/session';
import { EditAssignmentForm } from './EditAssignmentForm';

export const dynamic = 'force-dynamic';

export default async function EditAssignmentPage({
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

  return (
    <div>
      <Link
        href={`/assignments/${row.id}`}
        className="text-sm text-ink-muted hover:text-ink mb-4 inline-block"
      >
        ← До задачі
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink mb-2">
        Редагувати задачу
      </h1>
      <p className="text-ink-muted text-sm mb-8 max-w-xl">
        URL репозиторію зафіксовано в момент створення форку і не редагується. Змінити можна рівень позиції — ми оновимо{' '}
        <span className="font-mono">ASSIGNMENT.md</span> у форку.
      </p>

      <div className="max-w-2xl">
        <EditAssignmentForm
          id={row.id}
          shortId={row.shortId}
          sourceRepoUrl={row.sourceRepoUrl}
          seniority={row.seniority}
        />
      </div>
    </div>
  );
}
