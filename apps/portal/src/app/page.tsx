import { redirect } from 'next/navigation';

// Portal only owns specific paths on the apex (see infra/Caddyfile). Direct
// hits to '/' are routed to landing by Caddy; this redirect is a safety net
// for any direct-to-portal traffic (e.g. via the legacy portal.legal.org.ua
// redirect, or health-debugging).
export default function Root() {
  redirect('/app');
}
