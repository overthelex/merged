import NextAuth from 'next-auth';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;

  // Public paths (no auth required). Everything else requires a session.
  const PUBLIC = ['/login'];
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isAuthed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return Response.redirect(url);
  }

  if (isAuthed && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return Response.redirect(url);
  }
});

export const config = {
  // Exclude: Auth.js routes, public API (health, leads), static assets, favicon.
  matcher: ['/((?!api/auth|api/health|api/leads|api/github|invite|_next/static|_next/image|favicon\\.ico).*)'],
};
