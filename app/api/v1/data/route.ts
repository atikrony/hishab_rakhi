import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync } from '@/lib/db';
import { checkRateLimit, getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required to export ledger' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`data_get_${session.userId}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const db = await getDbAsync(session.userId);
    return NextResponse.json({
      success: true,
      data: db,
      meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        userId: session.userId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Internal data export failure' },
      { status: 500 }
    );
  }
}

