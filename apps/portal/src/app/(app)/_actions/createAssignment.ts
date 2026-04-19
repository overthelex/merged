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
import {
  parseGitHubUrl,
  forkRepo,
  protectMain,
  seedAssessmentBranch,
} from '@merged/github-app';
import { requireUser } from '@/lib/session';
import { shortId, inviteToken } from '@/lib/shortId';
import { getGitHubClient, getForkOrg } from '@/lib/github';
import { getPortalUrl } from '@/lib/urls';
import {
  renderAssignmentMarkdown,
  renderRunnerScript,
} from '@/lib/assignmentTemplate';
import { composeAssignmentFromRepo } from '@/lib/compose';
import {
  sendAssignmentCreatedEmail,
  seniorityLabel,
  stripGithubPrefix,
} from '@/lib/email';

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
  const forkName = `merged_developers-${sid}`;
  const forkOrg = getForkOrg();
  const token = inviteToken();
  const portalUrl = getPortalUrl();

  // Persist a pending_fork row first — we can retry the GitHub side later if it fails.
  const insertedAssignment = await db
    .insert(assignments)
    .values({
      shortId: sid,
      companyId,
      hrUserId: user.id,
      sourceRepoUrl: parsed.data.repoUrl,
      sourceRepoPrivate: parsed.data.isPrivate ? 1 : 0,
      forkOwner: forkOrg,
      forkName,
      forkUrl: null,
      seniority: parsed.data.seniority as Seniority,
      status: 'pending_fork',
      inviteToken: token,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    .returning({ id: assignments.id });
  const row = insertedAssignment[0];
  if (!row) throw new Error('Failed to create assignment');

  // Best-effort GitHub side. If the App isn't configured (local dev), we leave
  // the placeholder URL and status stays at pending_fork so the gap is visible.
  const gh = getGitHubClient();
  if (gh) {
    try {
      const source = await parseGitHubUrl(parsed.data.repoUrl);
      const fork = await forkRepo(gh, source, forkName);
      await protectMain(gh, forkName, fork.defaultBranch);

      // Run Scout → Composer → Calibrator against the source repo (identical
      // content to the fresh fork). A Bedrock/pipeline failure must not block
      // the HR flow — fall back to the hardcoded template.
      const composed = await safeCompose({
        repoUrl: parsed.data.repoUrl,
        accessToken: parsed.data.accessKey || undefined,
        seniority: parsed.data.seniority as Seniority,
        assignmentId: row.id,
      });
      const assignmentMarkdown =
        composed?.assignmentMd ??
        renderAssignmentMarkdown({
          seniority: parsed.data.seniority as Seniority,
          shortId: sid,
          portalUrl,
        });
      if (composed) {
        console.info('compose.ok', {
          assignmentId: row.id,
          taskId: composed.pipeline.spec.id,
          revisions: composed.pipeline.verdicts.length,
          surfaces: composed.pipeline.surfaces.length,
        });
      }

      await seedAssessmentBranch(gh, {
        forkName,
        defaultBranch: fork.defaultBranch,
        assignmentMarkdown,
        runnerShellScript: renderRunnerScript(),
      });

      await db
        .update(assignments)
        .set({
          forkUrl: fork.url,
          status: 'pending_candidate',
        })
        .where(eq(assignments.id, row.id));
    } catch (err) {
      console.error('fork flow failed', { assignmentId: row.id, err });
      return {
        ok: false,
        message:
          'Не вдалося створити форк. Перевірте URL і доступ, або спробуйте ще раз. Задачу збережено зі статусом pending_fork.',
      };
    }
  } else {
    // No GitHub App creds → local dev. Keep a reserved placeholder URL.
    await db
      .update(assignments)
      .set({
        forkUrl: `https://github.com/${forkOrg}/${forkName}`,
        status: 'pending_candidate',
      })
      .where(eq(assignments.id, row.id));
  }

  // Fetch the final row (after the fork flow) so the email reflects the
  // actual status + forkUrl rather than the pending placeholder.
  const [finalRow] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, row.id))
    .limit(1);

  await sendAssignmentCreatedEmail({
    to: user.contactEmail ?? user.email,
    assignmentId: row.id,
    inviteUrl: `${portalUrl}/invite/${sid}/${token}`,
    sourceRepo: stripGithubPrefix(parsed.data.repoUrl),
    forkUrl: finalRow?.forkUrl ?? null,
    seniorityLabel: seniorityLabel(parsed.data.seniority),
    shortId: sid,
    expiresAt: finalRow?.expiresAt ?? null,
  });

  redirect(`/assignments/${row.id}`);
}

async function safeCompose(opts: {
  repoUrl: string;
  accessToken?: string;
  seniority: Seniority;
  assignmentId: string;
}) {
  try {
    return await composeAssignmentFromRepo({
      repoUrl: opts.repoUrl,
      accessToken: opts.accessToken,
      seniority: opts.seniority,
    });
  } catch (err) {
    console.error('compose failed — falling back to template', {
      assignmentId: opts.assignmentId,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
