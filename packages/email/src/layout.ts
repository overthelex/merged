// Brand-styled HTML wrapper for all transactional emails. Uses inline styles
// because most email clients still strip <style> blocks. Colours mirror the
// portal's Tailwind tokens (see apps/portal/tailwind.config.ts).

export const BRAND = {
  paper: '#f7f6f1',
  paperDim: '#eeecea',
  surface: '#ffffff',
  ink: '#0b0f17',
  inkSoft: '#1a1f2b',
  inkMuted: '#4a5363',
  accent: '#00d488',
  accentDim: '#009f65',
  border: 'rgba(11,15,23,0.08)',
} as const;

export type LayoutInput = {
  preview: string;
  logoUrl: string;
  brandUrl: string;
  children: string;
};

export function renderLayout({ preview, logoUrl, brandUrl, children }: LayoutInput): string {
  return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>merged</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.paper};color:${BRAND.ink};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preview)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.paper};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
            <tr>
              <td style="padding:0 4px 20px 4px;">
                <a href="${brandUrl}" style="text-decoration:none;color:inherit;display:inline-flex;align-items:center;gap:10px;">
                  <img src="${logoUrl}" width="24" height="24" alt="merged" style="display:inline-block;vertical-align:middle;border:0;" />
                  <span style="font-weight:600;letter-spacing:-0.01em;font-size:15px;color:${BRAND.ink};">merged</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(11,15,23,0.05);">
                ${children}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 4px 0 4px;color:${BRAND.inkMuted};font-size:12px;line-height:1.6;">
                Цей лист надіслано автоматично з <a href="${brandUrl}" style="color:${BRAND.inkMuted};text-decoration:underline;">merged.com.ua</a>.
                Якщо ви отримали його помилково — просто проігноруйте.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px 0;">
    <tr>
      <td style="background:${BRAND.ink};border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:11px 18px;color:${BRAND.surface};text-decoration:none;font-weight:500;font-size:14px;line-height:1;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function monoBox(text: string): string {
  return `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;color:${BRAND.ink};background:${BRAND.paperDim};border:1px solid ${BRAND.border};border-radius:6px;padding:10px 12px;word-break:break-all;">${escapeHtml(text)}</div>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;letter-spacing:-0.015em;color:${BRAND.ink};font-weight:600;">${escapeHtml(text)}</h1>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:${BRAND.ink};">${html}</p>`;
}

export function muted(html: string): string {
  return `<p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:${BRAND.inkMuted};">${html}</p>`;
}

export function divider(): string {
  return `<div style="height:1px;background:${BRAND.border};margin:22px 0;"></div>`;
}

export function label(text: string): string {
  return `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.inkMuted};margin-bottom:6px;">${escapeHtml(text)}</div>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
