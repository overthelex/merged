'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, submissions, assignments, candidates, users } from '@merged/db';
import {
  sendAppealSubmittedEmail,
  seniorityLabel,
  stripGithubPrefix,
} from '@/lib/email';

const Schema = z.object({
  token: z.string().trim().min(1),
  reason: z
    .string()
    .trim()
    .min(20, { message: 'Опишіть причину детальніше (мінімум 20 символів).' })
    .max(4000, { message: 'Занадто довге пояснення (ліміт 4000 символів).' }),
});

export type AppealState = {
  ok: boolean;
  submitted?: boolean;
  message?: string;
};

export async function submitAppeal(
  _prev: AppealState,
  form: FormData,
): Promise<AppealState> {
  const parsed = Schema.safeParse({
    token: form.get('token') ?? '',
    reason: form.get('reason') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Перевірте поля форми.',
    };
  }

  const db = getDb();
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.appealToken, parsed.data.token))
    .limit(1);

  if (!submission) {
    return { ok: false, message: 'Невалідне посилання для апеляції.' };
  }
  if (submission.appealStatus !== 'none') {
    return { ok: false, message: 'Апеляцію по цій оцінці вже подано.' };
  }

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, submission.assignmentId))
    .limit(1);

  if (!assignment) {
    return { ok: false, message: 'Задачу не знайдено.' };
  }

  const candidate = submission.candidateId
    ? (
        await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, submission.candidateId))
          .limit(1)
      )[0] ?? null
    : null;

  const [hr] = await db
    .select({ email: users.email, contactEmail: users.contactEmail })
    .from(users)
    .where(eq(users.id, assignment.hrUserId))
    .limit(1);

  // Lock: bump status first so parallel submits see it as consumed.
  await db
    .update(submissions)
    .set({
      appealStatus: 'requested',
      appealReason: parsed.data.reason,
      appealRequestedAt: new Date(),
    })
    .where(eq(submissions.id, submission.id));

  // Reopen the assignment so the candidate can push a new PR.
  await db
    .update(assignments)
    .set({ status: 'in_progress' })
    .where(eq(assignments.id, assignment.id));

  const prUrl = `https://github.com/${stripGithubPrefix(assignment.forkUrl ?? assignment.sourceRepoUrl)}/pull/${submission.prNumber}`;

  const hrRecipient = hr?.contactEmail ?? hr?.email ?? null;
  if (hrRecipient) {
    await sendAppealSubmittedEmail({
      to: hrRecipient,
      assignmentId: assignment.id,
      prUrl,
      prNumber: submission.prNumber,
      score: submission.score ?? 0,
      reason: parsed.data.reason,
      githubUsername: candidate?.githubUsername ?? null,
      candidateEmail: candidate?.email ?? null,
      sourceRepo: stripGithubPrefix(assignment.sourceRepoUrl),
      seniorityLabel: seniorityLabel(assignment.seniority),
      shortId: assignment.shortId,
    });
  }

  return { ok: true, submitted: true };
}
