import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { safeNextPath } from '@/lib/safe-redirect';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 300, // 5 minutes
};

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent("Google sign-in isn't set up yet.")}`, origin)
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(googleAuthUrl.toString());
  // State cookie for CSRF verification in the callback
  response.cookies.set('hr_oauth_state', state, COOKIE_OPTS);

  // Where to land after sign-in (e.g. a shared link the user was trying to open)
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));
  if (next) {
    response.cookies.set('hr_oauth_next', next, COOKIE_OPTS);
  }

  return response;
}
