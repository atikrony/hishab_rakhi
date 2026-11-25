import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { getDbAsync } from '@/lib/db';
import { buildSavingsPlan } from '@/lib/savings-advisor';
import { findUserByIdAsync } from '@/lib/auth';

/** GET /api/v1/advisor?income=50000 — personalised savings plan for the signed-in user. */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });
  }

  const raw = Number(request.nextUrl.searchParams.get('income'));
  const incomeOverride = Number.isFinite(raw) && raw > 0 && raw < 1e10 ? Math.round(raw) : undefined;

  try {
    const [db, user] = await Promise.all([getDbAsync(session.userId), findUserByIdAsync(session.userId)]);
    const plan = buildSavingsPlan(db, { incomeOverride, salary: db.user?.monthlyIncome || user?.profile?.monthlyIncome });
    return NextResponse.json({ success: true, data: plan }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not build your plan.' }, { status: 500 });
  }
}
