// Portal-side facade for @merged/email. Centralises config + logging so
// callers just pass data; sending failures are caught and logged (never
// block the user-facing flow).

import {
  readEmailConfigFromEnv,
  sendEmail,
  renderWelcome,
  renderAssignmentCreated,
  renderCandidateAccepted,
  renderSubmissionReceived,
  renderSubmissionScored,
  type SendResult,
} from '@merged/email';

let _cfg: ReturnType<typeof readEmailConfigFromEnv> | undefined;

function config() {
  if (_cfg === undefined) _cfg = readEmailConfigFromEnv();
  return _cfg;
}

function portalUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL?.split(',')[0]?.trim();
  return raw ?? 'https://portal.merged.com.ua';
}

async function safeSend(
  label: string,
  recipient: string | string[] | null | undefined,
  rendered: { subject: string; html: string },
): Promise<void> {
  if (!recipient) {
    console.info('[email] skip', { label, reason: 'no recipient' });
    return;
  }
  try {
    const result: SendResult = await sendEmail(config(), {
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
    });
    if (result.ok) {
      console.info('[email] sent', { label, id: result.id });
    } else if ('skipped' in result && result.skipped) {
      console.info('[email] skip', { label, reason: result.reason });
    } else {
      console.error('[email] send failed', { label, error: result.error });
    }
  } catch (err) {
    console.error('[email] send threw', { label, err });
  }
}

export async function sendWelcomeEmail(to: string, name: string | null): Promise<void> {
  const cfg = config();
  const rendered = renderWelcome({
    name,
    brandUrl: cfg?.brandUrl ?? 'https://merged.com.ua',
    logoUrl:
      cfg?.logoUrl ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png',
    portalUrl: portalUrl(),
  });
  await safeSend('welcome', to, rendered);
}

export async function sendAssignmentCreatedEmail(input: {
  to: string;
  assignmentId: string;
  inviteUrl: string;
  sourceRepo: string;
  forkUrl: string | null;
  seniorityLabel: string;
  shortId: string;
  expiresAt: Date | null;
}): Promise<void> {
  const cfg = config();
  const portal = portalUrl();
  const rendered = renderAssignmentCreated({
    brandUrl: cfg?.brandUrl ?? 'https://merged.com.ua',
    logoUrl:
      cfg?.logoUrl ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png',
    portalUrl: portal,
    assignmentUrl: `${portal}/assignments/${input.assignmentId}`,
    inviteUrl: input.inviteUrl,
    sourceRepo: input.sourceRepo,
    forkUrl: input.forkUrl,
    seniorityLabel: input.seniorityLabel,
    shortId: input.shortId,
    expiresAt: input.expiresAt,
  });
  await safeSend('assignment_created', input.to, rendered);
}

export async function sendCandidateAcceptedEmail(input: {
  to: string;
  assignmentId: string;
  candidateId: string;
  githubUsername: string;
  candidateEmail: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
}): Promise<void> {
  const cfg = config();
  const portal = portalUrl();
  const rendered = renderCandidateAccepted({
    brandUrl: cfg?.brandUrl ?? 'https://merged.com.ua',
    logoUrl:
      cfg?.logoUrl ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png',
    portalUrl: portal,
    assignmentUrl: `${portal}/assignments/${input.assignmentId}`,
    candidateUrl: `${portal}/candidates/${input.candidateId}`,
    githubUsername: input.githubUsername,
    candidateEmail: input.candidateEmail,
    sourceRepo: input.sourceRepo,
    seniorityLabel: input.seniorityLabel,
    shortId: input.shortId,
  });
  await safeSend('candidate_accepted', input.to, rendered);
}

export async function sendSubmissionReceivedEmail(input: {
  to: string | string[];
  assignmentId: string;
  prUrl: string;
  prNumber: number;
  prHeadShaShort: string;
  githubUsername: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
}): Promise<void> {
  const cfg = config();
  const portal = portalUrl();
  const rendered = renderSubmissionReceived({
    brandUrl: cfg?.brandUrl ?? 'https://merged.com.ua',
    logoUrl:
      cfg?.logoUrl ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png',
    portalUrl: portal,
    assignmentUrl: `${portal}/assignments/${input.assignmentId}`,
    prUrl: input.prUrl,
    prNumber: input.prNumber,
    prHeadShaShort: input.prHeadShaShort,
    githubUsername: input.githubUsername,
    sourceRepo: input.sourceRepo,
    seniorityLabel: input.seniorityLabel,
    shortId: input.shortId,
  });
  await safeSend('submission_received', input.to, rendered);
}

export async function sendSubmissionScoredEmail(input: {
  to: string | string[];
  assignmentId: string;
  prUrl: string;
  prNumber: number;
  score: number;
  rubric: Array<{ key: string; label: string; score: number; max: number }>;
  githubUsername: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
}): Promise<void> {
  const cfg = config();
  const portal = portalUrl();
  const rendered = renderSubmissionScored({
    brandUrl: cfg?.brandUrl ?? 'https://merged.com.ua',
    logoUrl:
      cfg?.logoUrl ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png',
    portalUrl: portal,
    assignmentUrl: `${portal}/assignments/${input.assignmentId}`,
    prUrl: input.prUrl,
    prNumber: input.prNumber,
    score: input.score,
    rubric: input.rubric,
    githubUsername: input.githubUsername,
    sourceRepo: input.sourceRepo,
    seniorityLabel: input.seniorityLabel,
    shortId: input.shortId,
  });
  await safeSend('submission_scored', input.to, rendered);
}

export function seniorityLabel(v: string): string {
  return (
    { junior: 'Junior', middle: 'Middle', senior: 'Senior', architect: 'Architect' } as Record<
      string,
      string
    >
  )[v] ?? v;
}

export function stripGithubPrefix(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git\/?$/, '');
}
