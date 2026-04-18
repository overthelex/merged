import {
  renderLayout,
  heading,
  paragraph,
  button,
  label,
  monoBox,
  escapeHtml,
} from '../layout';

export type CandidateAcceptedInput = {
  brandUrl: string;
  logoUrl: string;
  portalUrl: string;
  assignmentUrl: string;
  candidateUrl: string;
  githubUsername: string;
  candidateEmail: string | null;
  sourceRepo: string;
  seniorityLabel: string;
  shortId: string;
};

export function renderCandidateAccepted(
  input: CandidateAcceptedInput,
): { subject: string; html: string } {
  const body = [
    heading('Кандидат прийняв запрошення'),
    paragraph(
      `<strong>@${escapeHtml(input.githubUsername)}</strong> прийняв запрошення на задачу <strong>${escapeHtml(input.shortId)}</strong> (${escapeHtml(input.seniorityLabel)}, ${escapeHtml(input.sourceRepo)}) і доданий як outside collaborator.`,
    ),
    input.candidateEmail ? label('E-mail') + monoBox(input.candidateEmail) : '',
    paragraph(
      'Далі кандидат працює в своєму IDE та відкриває PR проти <span style="font-family:ui-monospace,monospace;">main</span> форку. Ви отримаєте наступне повідомлення, коли PR зʼявиться.',
    ),
    button('Переглянути кандидата', input.candidateUrl),
  ]
    .filter(Boolean)
    .join('');

  return {
    subject: `@${input.githubUsername} прийняв задачу ${input.shortId}`,
    html: renderLayout({
      preview: `${input.githubUsername} прийняв запрошення на задачу ${input.shortId}.`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
