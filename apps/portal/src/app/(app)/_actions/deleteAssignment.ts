'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, assignments } from '@merged/db';
import { deleteRepo } from '@merged/github-app';
import { requireUser } from '@/lib/session';
import { getGitHubClient } from '@/lib/github';

const Schema = z.object({ id: z.string().uuid() });

export async function deleteAssignment(form: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = Schema.safeParse({ id: form.get('id') ?? '' });
  if (!parsed.success) return;

  const db = getDb();

  const [row] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, parsed.data.id), eq(assignments.hrUserId, user.id)))
    .limit(1);
  if (!row) return;

  const gh = getGitHubClient();
  if (gh && row.forkName) {
    try {
      await deleteRepo(gh, row.forkName);
    } catch (err) {
      // Fork may already be gone, or GitHub may 404/403. Drop the local row
      // regardless so the HR dashboard stays accurate, and log so ops can
      // chase any orphaned forks manually.
      console.error('deleteRepo failed', {
        assignmentId: row.id,
        forkName: row.forkName,
        err,
      });
    }
  }

  await db
    .delete(assignments)
    .where(and(eq(assignments.id, row.id), eq(assignments.hrUserId, user.id)));

  revalidatePath('/assignments');
  redirect('/assignments');
}
