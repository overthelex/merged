'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getDb, assignments, candidates, users } from '@merged/db';
import { inviteCollaborator } from '@merged/github-app';
import { getGitHubClient } from '@/lib/github';
import {
  sendCandidateAcceptedEmail,
  seniorityLabel,
  stripGithubPrefix,
} from '@/lib/email';

const GH_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const Schema = z.object({
  shortId: z.string().trim().min(1),
  token: z.string().trim().min(1),
  githubUsername: z
    .string()
    .trim()
    .min(1)
    .max(39)
    .regex(GH_USERNAME, { message: 'Некоректний GitHub username' }),
  email: z.string().trim().email().optional().or(z.literal('')),
});

export type AcceptInviteState = {
  ok: boolean;
  message?: string;
};

export async function acceptInvite(
  _prev: AcceptInviteState,
  form: FormData,
): Promise<AcceptInviteState> {
  const parsed = Schema.safeParse({
    shortId: form.get('shortId') ?? '',
    token: form.get('token') ?? '',
    githubUsername: form.get('githubUsername') ?? '',
    email: form.get('email') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Перевірте поля форми.',
    };
  }

  const db = getDb();
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.shortId, parsed.data.shortId),
        eq(assignments.inviteToken, parsed.data.token),
      ),
    )
    .limit(1);

  if (!assignment) return { ok: false, message: 'Невалідне посилання.' };
  if (assignment.expiresAt && assignment.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: 'Посилання прострочене.' };
  }
  if (!assignment.forkName) {
    return {
      ok: false,
      message: 'Форк ще не готовий. Спробуйте за хвилину.',
    };
  }

  const gh = getGitHubClient();
  if (gh) {
    try {
      await inviteCollaborator(gh, assignment.forkName, parsed.data.githubUsername);
    } catch (err) {
      console.error('collaborator invite failed', { assignmentId: assignment.id, err });
      return {
        ok: false,
        message:
          'Не вдалося додати вас як collaborator. Перевірте GitHub username або звʼяжіться з рекрутером.',
      };
    }
  }

  const [candidateRow] = await db
    .insert(candidates)
    .values({
      assignmentId: assignment.id,
      email: parsed.data.email || null,
      githubUsername: parsed.data.githubUsername,
      invitedAt: new Date(),
    })
    .returning({ id: candidates.id });

  await db
    .update(assignments)
    .set({ status: 'in_progress' })
    .where(eq(assignments.id, assignment.id));

  const [hr] = await db
    .select({ email: users.email, contactEmail: users.contactEmail })
    .from(users)
    .where(eq(users.id, assignment.hrUserId))
    .limit(1);

  const hrRecipient = hr?.contactEmail ?? hr?.email ?? null;
  if (hrRecipient && candidateRow?.id) {
    await sendCandidateAcceptedEmail({
      to: hrRecipient,
      assignmentId: assignment.id,
      candidateId: candidateRow.id,
      githubUsername: parsed.data.githubUsername,
      candidateEmail: parsed.data.email || null,
      sourceRepo: stripGithubPrefix(assignment.sourceRepoUrl),
      seniorityLabel: seniorityLabel(assignment.seniority),
      shortId: assignment.shortId,
    });
  }

  redirect(`/invite/${parsed.data.shortId}/${parsed.data.token}`);
}
