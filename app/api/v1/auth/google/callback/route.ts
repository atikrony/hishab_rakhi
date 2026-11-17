import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateGoogleUser } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth-token';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  const searchParams = request.nextUrl.searchParams;
  const errorParam = searchParams.get('error');
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const isDemo = searchParams.get('demo') === 'true';

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent('Google sign in was cancelled or denied.')}`, origin)
    );
  }

  // Handle Demo Google sign-in fallback (used if credentials aren't configured yet)
  if (isDemo) {
    const demoEmail = 'google.user@example.com';
    const demoName = 'Google Demo User';
    const demoAvatar = 'https://lh3.googleusercontent.com/a/default-user';

    const user = findOrCreateGoogleUser(demoEmail, demoName, demoAvatar);
    const sessionToken = await signSession({
      userId: user.id,
      email: user.email,
      name: user.profile?.name || demoName,
      onboardingCompleted: user.onboardingCompleted,
    });

    const destination = user.onboardingCompleted ? '/spend' : '/onboarding';
    const response = NextResponse.redirect(new URL(destination, origin));

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });
    return response;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Google+OAuth+is+not+configured+yet', origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Authorization+code+not+provided+by+Google', origin)
    );
  }

  // Validate state cookie for CSRF protection
  const savedState = request.cookies.get('hr_oauth_state')?.value;
  if (savedState && state && savedState !== state) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Invalid+OAuth+state.+Please+try+again.', origin)
    );
  }

  try {
    // Exchange authorization code for access token
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
      console.error('[Google OAuth Token Error]:', tokenData);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(
            tokenData.error_description || 'Failed to exchange authorization code with Google'
          )}`,
          origin
        )
      );
    }

    // Retrieve user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok || !userInfo.email) {
      return NextResponse.redirect(
        new URL('/auth/login?error=Failed+to+retrieve+profile+from+Google', origin)
      );
    }

    const email = userInfo.email.trim().toLowerCase();
    const name = userInfo.name || email.split('@')[0];
    const picture = userInfo.picture;

    // Find or create user in Hishab Rakhi
    const user = findOrCreateGoogleUser(email, name, picture);

    // Sign session token
    const sessionToken = await signSession({
      userId: user.id,
      email: user.email,
      name: user.profile?.name || name,
      onboardingCompleted: user.onboardingCompleted,
    });

    const destination = user.onboardingCompleted ? '/spend' : '/onboarding';
    const response = NextResponse.redirect(new URL(destination, origin));

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    // Clear state cookie
    response.cookies.delete('hr_oauth_state');

    return response;
  } catch (error: any) {
    console.error('[Google OAuth Callback Error]:', error);
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error?.message || 'Google authentication failed')}`,
        origin
      )
    );
  }
}

