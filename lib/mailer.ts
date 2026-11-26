/**
 * Transactional email via the Resend HTTP API (no extra dependency).
 *
 * Env:
 *   RESEND_API_KEY  - API key from https://resend.com
 *   EMAIL_FROM      - verified sender, e.g. "Hishab Rakhi <no-reply@yourdomain.com>"
 *
 * Without RESEND_API_KEY outside production, the email is printed to the server
 * console so the flow can be tested locally.
 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export interface SendResult {
  sent: boolean;
  /** true when the mail was only logged (local dev, no provider configured) */
  devLogged?: boolean;
  error?: string;
}

/** Public origin for links in emails. Prefer the configured URL over the Host header. */
export function getAppOrigin(requestOrigin: string): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  return configured || requestOrigin || 'http://localhost:3000';
}

export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[mailer:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
      return { sent: true, devLogged: true };
    }
    console.error('[mailer] RESEND_API_KEY is not set; cannot send email.');
    return { sent: false, error: 'Email service is not configured.' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Hishab Rakhi <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[mailer] Resend error', res.status, body.slice(0, 300));
      return { sent: false, error: 'Could not send email right now.' };
    }
    return { sent: true };
  } catch (err) {
    console.error('[mailer] network error', (err as Error)?.message);
    return { sent: false, error: 'Could not send email right now.' };
  }
}

function layout(heading: string, body: string, cta: string, url: string, footer: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:20px;font-weight:bold;padding-bottom:12px">${heading}</td></tr>
<tr><td style="font-size:15px;line-height:1.5;color:#3f3f46;padding-bottom:24px">${body}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px">${cta}</a></td></tr>
<tr><td style="font-size:12px;color:#71717a;line-height:1.5">${footer}<br><br>If the button doesn't work, paste this link into your browser:<br><span style="word-break:break-all">${url}</span></td></tr>
</table></td></tr></table></body></html>`;
}

export function sendVerificationEmail(to: string, name: string, url: string) {
  const safeName = escapeHtml(name || 'there');
  return sendEmail(
    to,
    'Verify your email for Hishab Rakhi',
    layout(
      `Hi ${safeName}, confirm your email`,
      'Thanks for signing up for Hishab Rakhi. Please confirm this is your email address to activate your account.',
      'Verify email',
      url,
      'This link expires in 24 hours. If you did not create an account, you can ignore this email.'
    ),
    `Hi ${name || 'there'},\n\nConfirm your email for Hishab Rakhi by opening this link (valid 24 hours):\n${url}\n\nIf you did not create an account, ignore this email.`
  );
}

export function sendPasswordResetEmail(to: string, url: string) {
  return sendEmail(
    to,
    'Reset your Hishab Rakhi password',
    layout(
      'Reset your password',
      'We received a request to reset the password for your Hishab Rakhi account.',
      'Choose a new password',
      url,
      'This link expires in 15 minutes. If you did not ask for this, you can ignore this email; your password will not change.'
    ),
    `Reset your Hishab Rakhi password with this link (valid 15 minutes):\n${url}\n\nIf you did not ask for this, ignore this email.`
  );
}
