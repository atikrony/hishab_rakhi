import { NextRequest, NextResponse } from 'next/server';
import { verifyUserPasswordAsync } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth-token';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`login_${ip}`, 20, 60000); // 20 attempts / min
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await verifyUserPasswordAsync(email, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Sign session token
    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.profile?.name,
      onboardingCompleted: user.onboardingCompleted,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.profile?.name,
        onboardingCompleted: user.onboardingCompleted,
      },
      message: 'Signed in successfully',
    });

    // Set secure HTTP-only cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
