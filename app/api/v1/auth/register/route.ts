import { NextRequest, NextResponse } from 'next/server';
import { createUserAsync, findUserByEmailAsync } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth-token';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`reg_${ip}`, 15, 60000); // 15 attempts / min
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, password } = body;

    const rawName = typeof name === 'string' ? name.trim() : '';
    if (!rawName) {
      return NextResponse.json(
        { success: false, error: 'Please enter your full name.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { success: false, error: 'Password must be under 128 characters.' },
        { status: 400 }
      );
    }

    const existing = await findUserByEmailAsync(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const newUser = await createUserAsync(email, password, rawName);

    return NextResponse.json({
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        onboardingCompleted: false,
      },
      message: 'Account created successfully! Please sign in.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

