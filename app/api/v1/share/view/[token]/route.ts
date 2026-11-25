import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, checkRateLimit } from '@/lib/security';
import { getShare } from '@/lib/shares';
import { getDbAsync } from '@/lib/db';
import { buildMonthReceipt } from '@/lib/month-report';

/**
 * Public endpoint behind a share link. Returns a read-only receipt of one
 * month's spending, after checking the link's access rules:
 *  - anyone:     anyone holding the link
 *  - restricted: only the owner and the emails the owner added (must be signed in)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(`share_view_${ip}`, 60, 60_000).allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  const { token } = await params;
  // Same response for "never existed" and "turned off" so tokens can't be probed
  const notFound = NextResponse.json(
    { success: false, code: 'not_found', error: 'This link is no longer available.' },
    { status: 404 }
  );

  const share = await getShare(token).catch(() => null);
  if (!share) return notFound;

  if (share.access === 'restricted') {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, code: 'sign_in', error: 'Sign in to view this shared spending.' },
        { status: 401 }
      );
    }
    const viewer = (session.email || '').toLowerCase();
    const allowed = session.userId === share.ownerId || share.emails.includes(viewer);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          code: 'no_access',
          error: `You don't have access. Ask the owner to add ${viewer || 'your email'}.`,
        },
        { status: 403 }
      );
    }
  }

  try {
    const db = await getDbAsync(share.ownerId);
    const receipt = buildMonthReceipt(db, share.month);
    return NextResponse.json(
      { success: true, data: receipt },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load this report.' }, { status: 500 });
  }
}
