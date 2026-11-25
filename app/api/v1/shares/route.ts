import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, checkRateLimit } from '@/lib/security';
import { createShare, listSharesForOwner, normalizeEmails, MONTH_RE, MAX_SHARE_EMAILS } from '@/lib/shares';

const unauthorized = () =>
  NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });

/** List the signed-in user's share links. */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  try {
    const shares = await listSharesForOwner(session.userId);
    return NextResponse.json({ success: true, data: shares });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Could not load share links.' }, { status: 500 });
  }
}

/** Create a read-only share link for one month of spending. */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const rate = checkRateLimit(`share_create_${session.userId}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: 'Too many links created. Try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const month = typeof body.month === 'string' ? body.month : '';
    if (!MONTH_RE.test(month)) {
      return NextResponse.json({ success: false, error: 'Choose a valid month.' }, { status: 400 });
    }
    const access = body.access === 'anyone' ? 'anyone' : 'restricted';
    const emails = normalizeEmails(body.emails ?? []);
    if (!emails) {
      return NextResponse.json(
        { success: false, error: `Enter valid email addresses (max ${MAX_SHARE_EMAILS}).` },
        { status: 400 }
      );
    }
    if (access === 'restricted' && emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Add at least one person, or allow anyone with the link.' },
        { status: 400 }
      );
    }

    const share = await createShare(session.userId, month, access, emails);
    return NextResponse.json({ success: true, data: share }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Could not create share link.' }, { status: 500 });
  }
}
