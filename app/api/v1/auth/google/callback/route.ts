import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateGoogleUserAsync } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth-token';
import { safeNextPath } from '@/lib/safe-redirect';

function loginError(origin: string, message: string) {
  const res = NextResponse.redirect(
    new URL(`/auth/login?error=${encodeURIComponent(message)}`, origin)
  );
  res.cookies.delete('hr_oauth_state');
  res.cookies.delete('hr_oauth_next');
  return res;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (searchParams.get('error')) {
    return loginError(origin, 'Google sign-in was cancelled.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return loginError(origin, "Google sign-in isn't set up yet.");
  }

  if (!code) {
    return loginError(origin, 'Google sign-in failed. Please try again.');
  }

  // CSRF protection: the state Google echoes back must match the cookie we set
  const savedState = request.cookies.get('hr_oauth_state')?.value;
  if (!savedState || !state || savedState !== state) {
    return loginError(origin, 'Sign-in session expired. Please try again.');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Google OAuth Token Error]:', tokenData?.error);
      return loginError(origin, 'Google sign-in failed. Please try again.');
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok || !userInfo.email || userInfo.email_verified === false) {
      return loginError(origin, 'Could not read a verified email from Google.');
    }

    const email = String(userInfo.email).trim().toLowerCase();
    const name = userInfo.name || email.split('@')[0];
    const picture = typeof userInfo.picture === 'string' ? userInfo.picture : undefined;

    const user = await findOrCreateGoogleUserAsync(email, name, picture);

    const sessionToken = await signSession({
      userId: user.id,
      email: user.email,
      name: user.profile?.name || name,
      onboardingCompleted: user.onboardingCompleted,
    });

    const next = safeNextPath(request.cookies.get('hr_oauth_next')?.value);
    const destination = next || '/spend';
    const response = NextResponse.redirect(new URL(destination, origin));

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });
    response.cookies.delete('hr_oauth_state');
    response.cookies.delete('hr_oauth_next');
    return response;
  } catch (error: any) {
    console.error('[Google OAuth Callback Error]:', error?.message);
    return loginError(origin, 'Google sign-in failed. Please try again.');
  }
}
