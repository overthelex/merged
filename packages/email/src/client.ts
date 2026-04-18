// Thin Resend client. No-op if RESEND_API_KEY isn't set so local dev keeps
// working without third-party credentials.

export type EmailConfig = {
  apiKey: string;
  from: string;
  brandUrl: string;
  logoUrl: string;
};

export function readEmailConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EmailConfig | null {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = env.EMAIL_FROM ?? 'merged <no-reply@merged.com.ua>';
  const brandUrl = env.EMAIL_BRAND_URL ?? 'https://merged.com.ua';
  const logoUrl =
    env.EMAIL_LOGO_URL ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png';
  return { apiKey, from, brandUrl, logoUrl };
}

export type SendInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string; error?: undefined }
  | { ok: false; skipped?: false; error: string; reason?: undefined };

export async function sendEmail(cfg: EmailConfig | null, input: SendInput): Promise<SendResult> {
  if (!cfg) return { ok: false, skipped: true, reason: 'RESEND_API_KEY not set' };

  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const cleanRecipients = recipients
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (cleanRecipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no recipients' };
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from ?? cfg.from,
      to: cleanRecipients,
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { ok: false, error: `resend ${resp.status}: ${body.slice(0, 500)}` };
  }

  const data = (await resp.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id ?? '' };
}
