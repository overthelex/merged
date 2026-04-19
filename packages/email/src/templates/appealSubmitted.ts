import {
  renderLayout,
  heading,
  paragraph,
  button,
  label,
  muted,
  escapeHtml,
} from '../layout';

export type AppealSubmittedInput = {
  brandUrl: string;
  logoUrl: string;
  assignmentUrl: string;
  prUrl: string;
  prNumber: number;
  score: number;
  reason: string;
  githubUsername: string | null;
  candidateEmail: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
};

export function renderAppealSubmitted(
  input: AppealSubmittedInput,
): { subject: string; html: string } {
  const author = input.githubUsername
    ? `<strong>@${escapeHtml(input.githubUsername)}</strong>`
    : 'Кандидат';

  const reasonBlock = `<div style="background:#eeecea;border:1px solid rgba(11,15,23,0.08);border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.6;color:#0b0f17;white-space:pre-wrap;">${escapeHtml(input.reason)}</div>`;

  const body = [
    heading('Кандидат подав апеляцію'),
    paragraph(
      `${author} не згоден з оцінкою <strong>${input.score}/100</strong> по PR #${input.prNumber} у задачі <strong>${escapeHtml(input.shortId)}</strong> (${escapeHtml(input.seniorityLabel)}, ${escapeHtml(input.sourceRepo)}).`,
    ),
    label('Причина'),
    reasonBlock,
    paragraph(
      'Задачу автоматично повернуто у статус <strong>in progress</strong> — кандидат може відкрити новий PR.',
    ),
    button('Відкрити задачу', input.assignmentUrl),
    button(`Відкрити PR #${input.prNumber}`, input.prUrl),
    muted(
      input.candidateEmail
        ? `Контакт кандидата: ${escapeHtml(input.candidateEmail)}`
        : 'Email кандидата не вказано.',
    ),
  ].join('');

  return {
    subject: `Апеляція · PR #${input.prNumber} · задача ${input.shortId}`,
    html: renderLayout({
      preview: `Кандидат оскаржує оцінку ${input.score}/100 по задачі ${input.shortId}.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
