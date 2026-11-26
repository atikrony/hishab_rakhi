import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailAsync, formatEmailToActualName } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security';
import { sendVerificationLink } from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  // Limit per IP and per address, so one inbox can't be flooded
  const ipRate = checkRateLimit(`verify_resend_ip_${ip}`, 10, 15 * 60000);
  const mailRate = checkRateLimit(`verify_resend_${email}`, 3, 15 * 60000);
  if (!ipRate.allowed || !mailRate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  // Same answer whether or not the account exists (no email harvesting)
  const generic = {
    success: true,
    message: 'If that account needs verification, a new link is on its way. Check your inbox and spam folder.',
  };

  const user = await findUserByEmailAsync(email);
  if (!user || user.emailVerified !== false) return NextResponse.json(generic);

  const result = await sendVerificationLink(
    user.email,
    user.profile?.name || formatEmailToActualName(user.email),
    request.nextUrl.origin
  );
  if (!result.sent) {
    return NextResponse.json({ success: false, error: result.error || 'Could not send email.' }, { status: 502 });
  }
  return NextResponse.json(generic);
}
