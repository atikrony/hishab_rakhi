import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { markTourCompletedAsync } from '@/lib/auth';

/** POST /api/v1/onboarding — the signed-in user finished (or skipped) the first-run tour. */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });
  }
  try {
    const ok = await markTourCompletedAsync(session.userId);
    if (!ok) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not save tour progress.' }, { status: 500 });
  }
}
