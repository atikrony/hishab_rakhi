import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { deleteShare, normalizeEmails, updateShare, MAX_SHARE_EMAILS } from '@/lib/shares';

/** Change who can open a link (owner only). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });

  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: { access?: 'restricted' | 'anyone'; emails?: string[] } = {};

  if (body.access !== undefined) {
    if (body.access !== 'anyone' && body.access !== 'restricted') {
      return NextResponse.json({ success: false, error: 'Invalid access setting.' }, { status: 400 });
    }
    patch.access = body.access;
  }
  if (body.emails !== undefined) {
    const emails = normalizeEmails(body.emails);
    if (!emails) {
      return NextResponse.json(
        { success: false, error: `Enter valid email addresses (max ${MAX_SHARE_EMAILS}).` },
        { status: 400 }
      );
    }
    patch.emails = emails;
  }

  try {
    const updated = await updateShare(token, session.userId, patch);
    if (!updated) return NextResponse.json({ success: false, error: 'Link not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not update link.' }, { status: 500 });
  }
}

/** Turn a link off permanently (owner only). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });

  const { token } = await params;
  try {
    const ok = await deleteShare(token, session.userId);
    if (!ok) return NextResponse.json({ success: false, error: 'Link not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not remove link.' }, { status: 500 });
  }
}
