import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/auth';
import { signPasswordResetToken } from '@/lib/auth-token';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`pwd_reset_${ip}`, 10, 60000 * 15); // 10 attempts per 15 min
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();
    const user = findUserByEmail(normalized);

    // If user not found, still return friendly message to prevent email harvesting
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, password reset instructions have been generated.',
      });
    }

    // Generate signed cryptographic reset token (15 min validity)
    const token = await signPasswordResetToken(user.email);
    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const resetUrl = `${origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    return NextResponse.json({
      success: true,
      resetUrl,
      message: 'Password reset link generated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

