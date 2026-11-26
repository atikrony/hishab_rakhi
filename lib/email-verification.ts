import { signEmailVerifyToken } from './auth-token';
import { sendVerificationEmail, getAppOrigin, SendResult } from './mailer';

export async function sendVerificationLink(email: string, name: string, requestOrigin: string): Promise<SendResult> {
  const token = await signEmailVerifyToken(email);
  const url = `${getAppOrigin(requestOrigin)}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendVerificationEmail(email, name, url);
}
