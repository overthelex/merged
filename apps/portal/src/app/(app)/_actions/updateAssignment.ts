'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, assignments, type Seniority } from '@merged/db';
import { updateAssessmentAssignmentMarkdown } from '@merged/github-app';
import { requireUser } from '@/lib/session';
import { getGitHubClient } from '@/lib/github';
import { getPortalUrl } from '@/lib/urls';
import { renderAssignmentMarkdown } from '@/lib/assignmentTemplate';

const Schema = z.object({
  id: z.string().uuid(),
  seniority: z.enum(['junior', 'middle', 'senior', 'architect']),
});

export type UpdateAssignmentState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<'seniority', string>>;
};

export async function updateAssignment(
  _prev: UpdateAssignmentState,
  form: FormData,
): Promise<UpdateAssignmentState> {
  const user = await requireUser();

  const parsed = Schema.safeParse({
    id: form.get('id') ?? '',
    seniority: form.get('seniority') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: UpdateAssignmentState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'seniority' && !fieldErrors.seniority) {
        fieldErrors.seniority = issue.message;
      }
    }
    return { ok: false, message: 'Перевірте поля форми.', fieldErrors };
  }

  const db = getDb();

  const [row] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, parsed.data.id), eq(assignments.hrUserId, user.id)))
    .limit(1);
  if (!row) {
    return { ok: false, message: 'Задачу не знайдено.' };
  }

  const next = parsed.data.seniority as Seniority;
  if (row.seniority !== next) {
    await db
      .update(assignments)
      .set({ seniority: next })
      .where(eq(assignments.id, row.id));

    const gh = getGitHubClient();
    if (gh && row.forkName && row.status !== 'pending_fork') {
      const portalUrl = getPortalUrl();
      try {
        await updateAssessmentAssignmentMarkdown(
          gh,
          row.forkName,
          renderAssignmentMarkdown({
            seniority: next,
            shortId: row.shortId,
            portalUrl,
          }),
        );
      } catch (err) {
        // Best-effort: DB already updated. Surface the partial failure so HR
        // can retry, but don't roll back the DB write.
        console.error('re-seed assessment markdown failed', {
          assignmentId: row.id,
          err,
        });
        return {
          ok: false,
          message:
            'Збережено, але не вдалося оновити ASSIGNMENT.md у форку. Спробуйте ще раз або звʼяжіться із підтримкою.',
        };
      }
    }
  }

  revalidatePath(`/assignments/${row.id}`);
  revalidatePath('/assignments');
  redirect(`/assignments/${row.id}`);
}
