import {
  renderLayout,
  heading,
  paragraph,
  label,
  monoBox,
  muted,
  divider,
  escapeHtml,
} from '../layout';

export type LeadReceivedInput = {
  brandUrl: string;
  logoUrl: string;
  lead: {
    email: string;
    name: string | null;
    company: string | null;
    role: string | null;
    note: string | null;
    source: string;
  };
  submittedAt: Date;
};

export function renderLeadReceived(
  input: LeadReceivedInput,
): { subject: string; html: string } {
  const { lead } = input;
  const when = input.submittedAt.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const rows: string[] = [];
  const row = (k: string, v: string | null): string | null =>
    v
      ? `<tr><td style="padding:6px 12px 6px 0;color:#4a5363;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#0b0f17;font-size:14px;line-height:1.55;vertical-align:top;">${escapeHtml(v)}</td></tr>`
      : null;

  [
    row('E-mail', lead.email),
    row('Імʼя', lead.name),
    row('Компанія', lead.company),
    row('Роль', lead.role),
    row('Джерело', lead.source),
    row('Час', when),
  ].forEach((r) => r && rows.push(r));

  const body = [
    heading('Нова заявка з лендингу'),
    paragraph(
      `Хтось натиснув <strong>«Запросити демо»</strong> — ось деталі, відповісти можна просто Reply.`,
    ),
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:6px 0 4px 0;">${rows.join('')}</table>`,
    lead.note ? label('Контекст') : '',
    lead.note ? monoBox(lead.note) : '',
    divider(),
    muted(
      `Заявка записана в таблицю <span style="font-family:ui-monospace,monospace;">leads</span>. Адреса-одержувач цього листа — <span style="font-family:ui-monospace,monospace;">request@merged.com.ua</span>.`,
    ),
  ]
    .filter(Boolean)
    .join('');

  const who = lead.company ?? lead.name ?? lead.email;

  return {
    subject: `Нова заявка на демо — ${who}`,
    html: renderLayout({
      preview: `Нова заявка з лендингу: ${who}`,
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
