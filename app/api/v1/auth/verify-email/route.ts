import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailVerifyToken } from '@/lib/auth-token';
import { markEmailVerifiedAsync } from '@/lib/auth';

/** Link target from the verification email. Confirms the address, then sends the user to sign in. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const token = request.nextUrl.searchParams.get('token') || '';
  const email = await verifyEmailVerifyToken(token);
  const url = new URL('/auth/login', origin);

  if (!email) {
    url.searchParams.set('error', 'This verification link is invalid or has expired. Sign in to get a new one.');
    return NextResponse.redirect(url);
  }

  const user = await markEmailVerifiedAsync(email);
  if (!user) {
    url.searchParams.set('error', 'We could not find an account for this link.');
  } else {
    url.searchParams.set('verified', 'true');
    url.searchParams.set('email', user.email);
  }
  return NextResponse.redirect(url);
}
