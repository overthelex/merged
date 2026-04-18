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

export type CandidateInviteInput = {
  brandUrl: string;
  logoUrl: string;
  inviteUrl: string;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
  hrName: string | null;
  hrEmail: string | null;
  companyName: string | null;
  expiresAt: Date | null;
  personalNote: string | null;
};

export function renderCandidateInvite(
  input: CandidateInviteInput,
): { subject: string; html: string } {
  const expires = input.expiresAt ? input.expiresAt.toISOString().slice(0, 10) : null;
  const fromLine = input.hrName
    ? input.companyName
      ? `${escapeHtml(input.hrName)} з ${escapeHtml(input.companyName)}`
      : escapeHtml(input.hrName)
    : input.companyName
      ? escapeHtml(input.companyName)
      : 'Команда merged';

  const body = [
    heading('Запрошення на інтервʼю'),
    paragraph(
      `${fromLine} запрошує вас виконати калібровану задачу рівня <strong>${escapeHtml(input.seniorityLabel)}</strong> на базі репозиторію <span style="font-family:ui-monospace,monospace;">${escapeHtml(input.sourceRepo)}</span>.`,
    ),
    input.personalNote
      ? paragraph(
          `<em style="color:#4a5363;">«${escapeHtml(input.personalNote)}»</em>`,
        )
      : '',
    paragraph(
      'Перейдіть за посиланням нижче і підтвердіть свій GitHub-акаунт — після цього ви отримаєте outside-collaborator доступ до приватного форку і зможете відкривати PR.',
    ),
    button('Прийняти запрошення', input.inviteUrl),
    label('Або скопіюйте посилання'),
    monoBox(input.inviteUrl),
    divider(),
    paragraph(
      '<strong>Як це працює:</strong> ви працюєте в окремій гілці форку, відкриваєте PR проти <span style="font-family:ui-monospace,monospace;">main</span>. Інструменти — на ваш вибір (IDE, AI-асистенти). Після відкриття PR ви автоматично отримаєте коментар з оцінкою по рубриці.',
    ),
    expires ? muted(`Запрошення дійсне до ${escapeHtml(expires)}.`) : '',
    input.hrEmail
      ? muted(
          `Питання — у відповідь на цей лист або напряму: <a href="mailto:${escapeHtml(input.hrEmail)}" style="color:#4a5363;">${escapeHtml(input.hrEmail)}</a>.`,
        )
      : '',
    muted(`ID задачі: <span style="font-family:ui-monospace,monospace;">${escapeHtml(input.shortId)}</span>`),
  ]
    .filter(Boolean)
    .join('');

  const subject = input.companyName
    ? `${input.companyName} · запрошення на інтервʼю (${input.seniorityLabel})`
    : `Запрошення на інтервʼю · ${input.seniorityLabel}`;

  return {
    subject,
    html: renderLayout({
      preview: `${fromLine.replace(/<[^>]+>/g, '')} запрошує вас виконати задачу ${input.seniorityLabel}.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
