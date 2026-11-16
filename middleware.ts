import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth-token';

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
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://api.dicebear.com https://images.unsplash.com https://lh3.googleusercontent.com; connect-src 'self';"
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

  // 3. Public Auth Routes (/auth/register, /auth/login)
  const isAuthRoute = pathname.startsWith('/auth/register') || pathname.startsWith('/auth/login');
  if (isAuthRoute) {
    if (session) {
      // If user is already authenticated
      if (!session.onboardingCompleted) {
        return withSecurityHeaders(NextResponse.redirect(new URL('/onboarding', request.url)));
      }
      return withSecurityHeaders(NextResponse.redirect(new URL('/spend', request.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // 4. Onboarding Route (/onboarding)
  if (pathname.startsWith('/onboarding')) {
    if (!session) {
      // Must register or sign in first
      return withSecurityHeaders(NextResponse.redirect(new URL('/auth/login', request.url)));
    }
    if (session.onboardingCompleted) {
      // Already completed onboarding, send to main dashboard
      return withSecurityHeaders(NextResponse.redirect(new URL('/spend', request.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // 5. API Routes handling
  if (pathname.startsWith('/api/')) {
    // Only public auth endpoints are login, register, and logout
    const isPublicAuth =
      pathname.startsWith('/api/v1/auth/login') ||
      pathname.startsWith('/api/v1/auth/register') ||
      pathname.startsWith('/api/v1/auth/logout');

    if (isPublicAuth) {
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

  // 6. Protected Core Application Routes (/, /spend, /summary, /pocket, etc.)
  if (!session) {
    // Redirect unauthenticated requests to login
    return withSecurityHeaders(NextResponse.redirect(new URL('/auth/login', request.url)));
  }

  if (!session.onboardingCompleted) {
    // User must fill up the onboarding form before using the dashboard
    return withSecurityHeaders(NextResponse.redirect(new URL('/onboarding', request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg).*)'],
};
