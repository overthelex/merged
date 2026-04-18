'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, assignments, candidates, companies } from '@merged/db';
import { requireUser } from '@/lib/session';
import {
  sendCandidateInviteEmail,
  seniorityLabel,
  stripGithubPrefix,
} from '@/lib/email';

const Schema = z.object({
  id: z.string().uuid(),
  email: z.string().trim().toLowerCase().email('Неправильний e-mail.'),
  note: z.string().trim().max(400).optional().or(z.literal('')),
});

export type InviteCandidateState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<'email' | 'note', string>>;
};

export async function inviteCandidate(
  _prev: InviteCandidateState,
  form: FormData,
): Promise<InviteCandidateState> {
  const user = await requireUser();

  const parsed = Schema.safeParse({
    id: form.get('id') ?? '',
    email: form.get('email') ?? '',
    note: form.get('note') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: InviteCandidateState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === 'email' || key === 'note') && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
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

  const [company] = row.companyId
    ? await db.select().from(companies).where(eq(companies.id, row.companyId)).limit(1)
    : [];

  const baseUrl =
    process.env.PUBLIC_BASE_URL?.split(',')[0]?.trim() ?? 'https://merged.com.ua';
  const inviteUrl = `${baseUrl}/invite/${row.shortId}/${row.inviteToken}`;

  const note = parsed.data.note && parsed.data.note.length > 0 ? parsed.data.note : null;

  const result = await sendCandidateInviteEmail({
    to: parsed.data.email,
    inviteUrl,
    sourceRepo: stripGithubPrefix(row.sourceRepoUrl),
    seniorityLabel: seniorityLabel(row.seniority),
    shortId: row.shortId,
    hrName: user.name ?? null,
    hrEmail: user.email ?? null,
    companyName: company?.name ?? null,
    expiresAt: row.expiresAt ?? null,
    personalNote: note,
  });

  if (!result.sent) {
    return {
      ok: false,
      message:
        result.reason === 'RESEND_API_KEY not set'
          ? 'Email-провайдер не налаштовано на цьому оточенні (RESEND_API_KEY). Посилання зʼявилося у картці — можете скопіювати вручну.'
          : `Не вдалося надіслати лист: ${result.reason ?? 'невідома помилка'}`,
    };
  }

  // Upsert candidate row keyed by (assignment, email) so repeat invites don't
  // pile up. We only track email + invitedAt here — githubUsername is set
  // when the candidate accepts.
  const [existing] = await db
    .select()
    .from(candidates)
    .where(
      and(eq(candidates.assignmentId, row.id), eq(candidates.email, parsed.data.email)),
    )
    .limit(1);

  if (existing) {
    await db
      .update(candidates)
      .set({ invitedAt: new Date() })
      .where(eq(candidates.id, existing.id));
  } else {
    await db.insert(candidates).values({
      assignmentId: row.id,
      email: parsed.data.email,
      invitedAt: new Date(),
    });
  }

  revalidatePath(`/assignments/${row.id}`);

  return { ok: true, message: `Запрошення надіслано на ${parsed.data.email}.` };
}
