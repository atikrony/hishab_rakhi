import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailAsync } from '@/lib/auth';
import { sendPasswordResetEmail, getAppOrigin, isMailerConfigured } from '@/lib/mailer';
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
    const user = await findUserByEmailAsync(normalized);

    // If user not found, still return friendly message to prevent email harvesting
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a reset link is on its way.',
      });
    }

    // Signed reset token (15 min validity), delivered only by email
    const token = await signPasswordResetToken(user.email);
    const resetUrl = `${getAppOrigin(request.nextUrl.origin)}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    const mail = await sendPasswordResetEmail(user.email, resetUrl);
    if (!mail.sent) {
      return NextResponse.json({ success: false, error: mail.error || 'Could not send email.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link is on its way.',
      // Local development without a mail provider only: return the link so the flow is testable
      ...(process.env.NODE_ENV !== 'production' && !isMailerConfigured() ? { resetUrl } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

