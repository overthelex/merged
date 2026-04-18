import {
  renderLayout,
  heading,
  paragraph,
  button,
  label,
  monoBox,
  escapeHtml,
} from '../layout';

export type SubmissionScoredInput = {
  brandUrl: string;
  logoUrl: string;
  portalUrl: string;
  assignmentUrl: string;
  prUrl: string;
  prNumber: number;
  score: number;
  rubric: Array<{ key: string; label: string; score: number; max: number }>;
  githubUsername: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
};

export function renderSubmissionScored(
  input: SubmissionScoredInput,
): { subject: string; html: string } {
  const author = input.githubUsername
    ? `<strong>@${escapeHtml(input.githubUsername)}</strong>`
    : 'кандидата';

  const rubricRows = input.rubric
    .map(
      (r) =>
        `<tr>
          <td style="padding:6px 0;font-size:13px;color:#0b0f17;">${escapeHtml(r.label)}</td>
          <td style="padding:6px 0;font-size:13px;font-family:ui-monospace,monospace;color:#4a5363;text-align:right;">${r.score} / ${r.max}</td>
        </tr>`,
    )
    .join('');

  const body = [
    heading(`Оцінка: ${input.score} / 100`),
    paragraph(
      `Автоматичне оцінювання PR #${input.prNumber} від ${author} у задачі <strong>${escapeHtml(input.shortId)}</strong> (${escapeHtml(input.seniorityLabel)}, ${escapeHtml(input.sourceRepo)}) завершено.`,
    ),
    input.rubric.length
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid rgba(11,15,23,0.08);border-bottom:1px solid rgba(11,15,23,0.08);margin:10px 0 18px 0;">${rubricRows}</table>`
      : '',
    button(`Відкрити PR #${input.prNumber}`, input.prUrl),
    button('Відкрити задачу', input.assignmentUrl),
  ]
    .filter(Boolean)
    .join('');

  return {
    subject: `Оцінка ${input.score}/100 — PR #${input.prNumber} · задача ${input.shortId}`,
    html: renderLayout({
      preview: `Оцінка ${input.score}/100 по задачі ${input.shortId}.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
