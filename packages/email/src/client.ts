// Thin SMTP client built on nodemailer. No-op if SMTP_HOST isn't set so
// local dev keeps working without mail-server credentials.

import nodemailer, { type Transporter } from 'nodemailer';

export type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  from: string;
  brandUrl: string;
  logoUrl: string;
};

export function readEmailConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EmailConfig | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number.parseInt(env.SMTP_PORT ?? '465', 10);
  // Default to implicit TLS on 465; STARTTLS otherwise. Explicit override wins.
  const secure = env.SMTP_SECURE
    ? env.SMTP_SECURE === 'true' || env.SMTP_SECURE === '1'
    : port === 465;
  const user = env.SMTP_USER?.trim() || null;
  const pass = env.SMTP_PASS ?? null;
  const from = env.EMAIL_FROM ?? 'merged <no-reply@merged.com.ua>';
  const brandUrl = env.EMAIL_BRAND_URL ?? 'https://merged.com.ua';
  const logoUrl =
    env.EMAIL_LOGO_URL ?? 'https://portal.merged.com.ua/brand/logo-ink-128.png';
  return { host, port, secure, user, pass, from, brandUrl, logoUrl };
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

let _transport: Transporter | null = null;
let _transportKey: string | null = null;

function transport(cfg: EmailConfig): Transporter {
  const key = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user ?? ''}`;
  if (_transport && _transportKey === key) return _transport;
  _transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  _transportKey = key;
  return _transport;
}

export async function sendEmail(cfg: EmailConfig | null, input: SendInput): Promise<SendResult> {
  if (!cfg) return { ok: false, skipped: true, reason: 'SMTP not configured' };

  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const cleanRecipients = recipients
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (cleanRecipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no recipients' };
  }

  try {
    const info = await transport(cfg).sendMail({
      from: input.from ?? cfg.from,
      to: cleanRecipients,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    return { ok: true, id: info.messageId ?? '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `smtp: ${msg.slice(0, 500)}` };
  }
}
