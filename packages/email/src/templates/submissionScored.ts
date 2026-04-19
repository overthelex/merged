import {
  renderLayout,
  heading,
  paragraph,
  button,
  muted,
  divider,
  escapeHtml,
} from '../layout';

export type SubmissionScoredInput = {
  brandUrl: string;
  logoUrl: string;
  assignmentUrl: string;
  prUrl: string;
  prNumber: number;
  score: number;
  rubric: Array<{ key: string; label: string; score: number; max: number }>;
  githubUsername: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
  appealUrl: string | null;
};

export function renderSubmissionScored(
  input: SubmissionScoredInput,
): { subject: string; html: string } {
  const rubricRows = input.rubric
    .map(
      (r) =>
        `<tr>
          <td style="padding:6px 0;font-size:13px;color:#0b0f17;">${escapeHtml(r.label)}</td>
          <td style="padding:6px 0;font-size:13px;font-family:ui-monospace,monospace;color:#4a5363;text-align:right;">${r.score} / ${r.max}</td>
        </tr>`,
    )
    .join('');

  const appealBlock = input.appealUrl
    ? [
        divider(),
        paragraph(
          `<strong>Не згодні з оцінкою?</strong> Ви можете подати апеляцію й пройти задачу ще раз. Коротко опишіть, що, на вашу думку, було оцінено невірно — ми повернемо задачу в статус «in progress», і ви зможете відкрити новий PR.`,
        ),
        button('Подати апеляцію', input.appealUrl),
        muted('Посилання одноразове й привʼязане саме до цієї оцінки.'),
      ].join('')
    : '';

  const body = [
    heading(`Ваша оцінка: ${input.score} / 100`),
    paragraph(
      `Автоматичне оцінювання PR #${input.prNumber} у задачі <strong>${escapeHtml(input.shortId)}</strong> (${escapeHtml(input.seniorityLabel)}, ${escapeHtml(input.sourceRepo)}) завершено. Нижче — розбивка по критеріях.`,
    ),
    input.rubric.length
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid rgba(11,15,23,0.08);border-bottom:1px solid rgba(11,15,23,0.08);margin:10px 0 18px 0;">${rubricRows}</table>`
      : '',
    button(`Відкрити PR #${input.prNumber}`, input.prUrl),
    appealBlock,
  ]
    .filter(Boolean)
    .join('');

  return {
    subject: `Ваша оцінка: ${input.score}/100 — задача ${input.shortId}`,
    html: renderLayout({
      preview: `Оцінка ${input.score}/100 по задачі ${input.shortId}.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
