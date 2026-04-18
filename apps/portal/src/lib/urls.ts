// Single source of truth for the portal's own external URL. Used in server
// actions and email templates whenever we render a link to /invite,
// /assignments, /candidates, etc.
//
// Historically the code reached for `PUBLIC_BASE_URL` (comma-separated list
// of apex + portal hosts) and took the first entry, but the first entry is
// the marketing landing — so every generated link hit a 404. Prefer
// `PORTAL_URL`, fall back to `AUTH_URL` (next-auth's canonical portal URL),
// and only then a hardcoded default.

export function getPortalUrl(): string {
  const fromPortal = process.env.PORTAL_URL?.trim();
  if (fromPortal) return stripTrailingSlash(fromPortal);
  const fromAuth = process.env.AUTH_URL?.trim();
  if (fromAuth) return stripTrailingSlash(fromAuth);
  return 'https://portal.merged.com.ua';
}

function stripTrailingSlash(u: string): string {
  return u.endsWith('/') ? u.slice(0, -1) : u;
}
