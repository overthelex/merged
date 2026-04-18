import {
  renderLayout,
  heading,
  paragraph,
  button,
  monoBox,
  label,
  muted,
  divider,
  escapeHtml,
} from '../layout';

export type AssignmentCreatedInput = {
  brandUrl: string;
  logoUrl: string;
  portalUrl: string;
  assignmentUrl: string;
  inviteUrl: string;
  sourceRepo: string;
  forkUrl: string | null;
  seniorityLabel: string;
  shortId: string;
  expiresAt: Date | null;
};

export function renderAssignmentCreated(
  input: AssignmentCreatedInput,
): { subject: string; html: string } {
  const expires = input.expiresAt ? input.expiresAt.toISOString().slice(0, 10) : null;

  const body = [
    heading('Задачу створено'),
    paragraph(
      `Задача <strong>${escapeHtml(input.shortId)}</strong> (${escapeHtml(input.seniorityLabel)}) на базі репозиторію <span style="font-family:ui-monospace,monospace;">${escapeHtml(input.sourceRepo)}</span> готова.`,
    ),
    label('Посилання для кандидата'),
    monoBox(input.inviteUrl),
    paragraph(
      'Надішліть це посилання кандидату e-mail-ом разом із access key (якщо репо приватне). Посилання привʼяже GitHub-акаунт кандидата до форку.',
    ),
    button('Відкрити задачу в порталі', input.assignmentUrl),
    divider(),
    input.forkUrl
      ? label('Форк') + monoBox(input.forkUrl)
      : muted('Форк ще створюється — подивіться статус на сторінці задачі.'),
    expires ? muted(`Запрошення дійсне до ${expires}.`) : '',
  ]
    .filter(Boolean)
    .join('');

  return {
    subject: `Задача ${input.shortId} створена — ${input.seniorityLabel}`,
    html: renderLayout({
      preview: `Задача ${input.shortId} готова. Посилання для кандидата всередині.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
