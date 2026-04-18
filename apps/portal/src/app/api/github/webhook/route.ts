import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import {
  getDb,
  assignments,
  submissions,
  candidates,
} from '@merged/db';
import {
  verifyAndParseWebhook,
  WebhookError,
  readGitHubAppConfigFromEnv,
} from '@merged/github-app';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const cfg = readGitHubAppConfigFromEnv();
  if (!cfg) {
    return NextResponse.json(
      { error: 'github app not configured' },
      { status: 503 },
    );
  }

  const body = await req.text();
  let payload;
  try {
    payload = await verifyAndParseWebhook({
      secret: cfg.webhookSecret,
      headers: req.headers,
      body,
    });
  } catch (err) {
    if (err instanceof WebhookError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  try {
    await dispatch(payload.event, payload.json);
  } catch (err) {
    console.error('webhook dispatch failed', {
      event: payload.event,
      deliveryId: payload.deliveryId,
      err,
    });
    return NextResponse.json({ error: 'dispatch failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: payload.event });
}

async function dispatch(event: string, json: unknown): Promise<void> {
  switch (event) {
    case 'ping':
      return;
    case 'pull_request':
      return handlePullRequest(json as PullRequestEvent);
    case 'push':
    case 'pull_request_review':
    case 'check_run':
      return; // reserved; scoring pipeline will consume these later
    default:
      return;
  }
}

type PullRequestEvent = {
  action: string;
  pull_request: {
    number: number;
    head: { sha: string; ref: string };
    base: { ref: string };
    user?: { login: string };
  };
  repository: {
    owner: { login: string };
    name: string;
  };
};

async function handlePullRequest(e: PullRequestEvent): Promise<void> {
  if (!['opened', 'synchronize', 'reopened'].includes(e.action)) return;
  if (e.pull_request.base.ref !== 'main') return;

  const db = getDb();
  const repoOwner = e.repository.owner.login;
  const repoName = e.repository.name;

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(eq(assignments.forkOwner, repoOwner), eq(assignments.forkName, repoName)),
    )
    .limit(1);

  if (!assignment) {
    console.warn('PR webhook for unknown fork', { repoOwner, repoName });
    return;
  }

  const candidateLogin = e.pull_request.user?.login;
  let candidateId: string | null = null;
  if (candidateLogin) {
    const [cand] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.assignmentId, assignment.id),
          eq(candidates.githubUsername, candidateLogin),
        ),
      )
      .limit(1);
    candidateId = cand?.id ?? null;
  }

  const existing = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, assignment.id),
        eq(submissions.prNumber, e.pull_request.number),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(submissions).values({
      assignmentId: assignment.id,
      candidateId,
      prNumber: e.pull_request.number,
      prHeadSha: e.pull_request.head.sha,
    });
  } else {
    const hit = existing[0];
    if (!hit) return;
    await db
      .update(submissions)
      .set({ prHeadSha: e.pull_request.head.sha })
      .where(eq(submissions.id, hit.id));
  }

  if (assignment.status === 'pending_candidate') {
    await db
      .update(assignments)
      .set({ status: 'submitted' })
      .where(eq(assignments.id, assignment.id));
  }
}
