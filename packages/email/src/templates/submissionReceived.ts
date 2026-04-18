import {
  renderLayout,
  heading,
  paragraph,
  button,
  label,
  monoBox,
  escapeHtml,
} from '../layout';

export type SubmissionReceivedInput = {
  brandUrl: string;
  logoUrl: string;
  portalUrl: string;
  assignmentUrl: string;
  prUrl: string;
  prNumber: number;
  prHeadShaShort: string;
  githubUsername: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
};

export function renderSubmissionReceived(
  input: SubmissionReceivedInput,
): { subject: string; html: string } {
  const author = input.githubUsername
    ? `<strong>@${escapeHtml(input.githubUsername)}</strong>`
    : 'кандидат';

  const body = [
    heading('Новий PR на перевірку'),
    paragraph(
      `${author} відкрив pull request #${input.prNumber} у задачі <strong>${escapeHtml(input.shortId)}</strong> (${escapeHtml(input.seniorityLabel)}, ${escapeHtml(input.sourceRepo)}).`,
    ),
    label('Комміт'),
    monoBox(input.prHeadShaShort),
    button(`Відкрити PR #${input.prNumber}`, input.prUrl),
    paragraph(
      'Автоматичне оцінювання буде додано до сторінки задачі щойно scoring-пайплайн відпрацює.',
    ),
    button('Відкрити задачу', input.assignmentUrl),
  ].join('');

  return {
    subject: `PR #${input.prNumber} у задачі ${input.shortId}`,
    html: renderLayout({
      preview: `Новий PR #${input.prNumber} у задачі ${input.shortId}.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
