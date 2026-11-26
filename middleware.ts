import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth-token';
import { safeNextPath } from '@/lib/safe-redirect';
import { isAdminEmail } from '@/lib/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, favicon, manifest, and icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icon.svg') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check session token (cookie or Bearer header)
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let session = await verifySession(sessionCookie);

  if (!session) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      session = await verifySession(token);
    }
  }

  // Helper to add security headers to any response
  const withSecurityHeaders = (response: NextResponse) => {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://api.dicebear.com https://images.unsplash.com https://lh3.googleusercontent.com https://*.googleusercontent.com; connect-src 'self';"
    );
    return response;
  };

  // Canonical redirects for short auth URLs
  if (pathname === '/login') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/auth/login', request.url)));
  }
  if (pathname === '/register') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/auth/register', request.url)));
  }
  if (pathname === '/forgot-password') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/auth/forgot-password', request.url)));
  }
  if (pathname === '/reset-password') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/auth/reset-password', request.url)));
  }

  // 3. Public Auth Routes (/auth/register, /auth/login, /auth/forgot-password, /auth/reset-password)
  const isAuthRoute =
    pathname.startsWith('/auth/register') ||
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/forgot-password') ||
    pathname.startsWith('/auth/reset-password');
  if (isAuthRoute) {
    if (session) {
      // Already signed in
      const next = safeNextPath(request.nextUrl.searchParams.get('next'));
      return withSecurityHeaders(NextResponse.redirect(new URL(next || '/spend', request.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // Read-only share links: public page; the view API enforces who may see it
  if (pathname.startsWith('/share/')) {
    return withSecurityHeaders(NextResponse.next());
  }

  // 4. Old onboarding URL: the setup form was replaced by an in-app tour
  if (pathname.startsWith('/onboarding')) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL(session ? '/spend' : '/auth/login', request.url))
    );
  }

  // 5. API Routes handling
  if (pathname.startsWith('/api/')) {
    // Public auth and status endpoints
    const isPublicAuth =
      pathname.startsWith('/api/v1/auth/login') ||
      pathname.startsWith('/api/v1/auth/register') ||
      pathname.startsWith('/api/v1/auth/logout') ||
      pathname.startsWith('/api/v1/auth/forgot-password') ||
      pathname.startsWith('/api/v1/auth/reset-password') ||
      pathname.startsWith('/api/v1/auth/google') ||
      pathname.startsWith('/api/v1/auth/verify-email') ||
      pathname.startsWith('/api/v1/auth/resend-verification') ||
      pathname.startsWith('/api/v1/share/view/') ||
      pathname === '/api/v1/kotojon/visit';

    if (isPublicAuth) {
      return withSecurityHeaders(NextResponse.next());
    }

    // Admin-only research APIs (/api/v1/kotojon, /api/v1/kotojon/research)
    if (pathname.startsWith('/api/v1/kotojon')) {
      if (!session || !isAdminEmail(session.email)) {
        return withSecurityHeaders(
          NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
        );
      }
      return withSecurityHeaders(NextResponse.next());
    }

    // Protected API routes require either verified session or valid API key
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.MOBILE_API_KEY;
    const isApiKeyValid = Boolean(validApiKey && apiKey && apiKey === validApiKey);

    if (!session && !isApiKeyValid) {
      return withSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Authentication required. Please sign in.' },
          { status: 401 }
        )
      );
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // 6. Hidden admin research dashboard (/kotojon): admins only, 404 for everyone else
  if (pathname.startsWith('/kotojon')) {
    // No redirect, no hint: signed-out visitors and non-admins just get a 404
    if (!session || !isAdminEmail(session.email)) {
      return withSecurityHeaders(new NextResponse('Not found', { status: 404 }));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // 7. Protected Core Application Routes (/, /spend, /summary, /pocket, etc.)
  if (!session) {
    // Redirect unauthenticated requests to login
    return withSecurityHeaders(NextResponse.redirect(new URL('/auth/login', request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg).*)'],
};
