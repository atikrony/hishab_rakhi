import { NextRequest, NextResponse } from 'next/server';
import { updateUserPassword } from '@/lib/auth';
import { verifyPasswordResetToken } from '@/lib/auth-token';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`reset_submit_${ip}`, 10, 60000 * 15);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and new password are required.' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
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

    // Cryptographically verify reset token
    const tokenEmail = await verifyPasswordResetToken(token);
    if (!tokenEmail || tokenEmail.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired password reset token. Please request a new link.' },
        { status: 400 }
      );
    }

    // Update user password in storage
    const updated = updateUserPassword(tokenEmail, password);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Unable to update password. Account not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Password reset failed' },
      { status: 500 }
    );
  }
}

