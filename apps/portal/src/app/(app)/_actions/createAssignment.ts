'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import {
  getDb,
  assignments,
  companies,
  users,
  type Seniority,
} from '@merged/db';
import { requireUser } from '@/lib/session';
import { shortId, inviteToken } from '@/lib/shortId';

const GITHUB_URL = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s.]+)(?:\.git)?\/?$/i;

const Schema = z.object({
  repoUrl: z.string().trim().url().regex(GITHUB_URL, {
    message: 'Наразі підтримується лише GitHub URL вигляду https://github.com/<owner>/<repo>',
  }),
  isPrivate: z.enum(['yes', 'no']).transform((v) => v === 'yes'),
  accessKey: z.string().trim().max(200).optional().or(z.literal('')),
  seniority: z.enum(['junior', 'middle', 'senior', 'architect']),
});

export type CreateAssignmentState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof Schema>, string>>;
};

export async function createAssignment(
  _prev: CreateAssignmentState,
  form: FormData,
): Promise<CreateAssignmentState> {
  const user = await requireUser();

  const parsed = Schema.safeParse({
    repoUrl: form.get('repoUrl') ?? '',
    isPrivate: form.get('isPrivate') ?? 'no',
    accessKey: form.get('accessKey') ?? '',
    seniority: form.get('seniority') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors: CreateAssignmentState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof Schema>;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Перевірте поля форми.', fieldErrors };
  }

  if (parsed.data.isPrivate && !parsed.data.accessKey) {
    return {
      ok: false,
      message: 'Для приватного репозиторію вкажіть access key.',
      fieldErrors: { accessKey: 'Обовʼязково для приватних репо.' },
    };
  }

  const db = getDb();

  let companyId = user.companyId;
  if (!companyId) {
    const defaultName = user.email.split('@')[1] ?? 'Company';
    const defaultSlug = `c-${shortId(8)}`;
    const inserted = await db
      .insert(companies)
      .values({ name: defaultName, slug: defaultSlug })
      .returning({ id: companies.id });
    const company = inserted[0];
    if (!company) throw new Error('Failed to create company');
    companyId = company.id;
    await db.update(users).set({ companyId }).where(eq(users.id, user.id));
  }

  const sid = shortId(10);
  const forkOwner = 'overthelex';
  const forkName = `merged_developers-${sid}`;
  const forkUrl = `https://github.com/${forkOwner}/${forkName}`;
  const token = inviteToken();

  const inserted = await db
    .insert(assignments)
    .values({
      shortId: sid,
      companyId,
      hrUserId: user.id,
      sourceRepoUrl: parsed.data.repoUrl,
      sourceRepoPrivate: parsed.data.isPrivate ? 1 : 0,
      forkOwner,
      forkName,
      forkUrl,
      seniority: parsed.data.seniority as Seniority,
      status: 'pending_candidate',
      inviteToken: token,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    .returning({ id: assignments.id });
  const row = inserted[0];
  if (!row) throw new Error('Failed to create assignment');

  // TODO(Phase B): actual GitHub fork creation via GitHub App.
  redirect(`/assignments/${row.id}`);
}
