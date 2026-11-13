import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync, resetDb } from '@/lib/db';
import { verifyApiAuthorization, checkRateLimit, getSessionFromRequest } from '@/lib/security';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`data_post_${session.userId}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, importedData } = body;

    if (action === 'reset') {
      const { initializeBlankUserLedger, findUserById } = await import('@/lib/auth');
      const user = findUserById(session.userId);
      const resetData = initializeBlankUserLedger(session.userId, user?.email || 'user@hishabrakhi.com');
      return NextResponse.json({
        success: true,
        data: resetData,
        message: 'Personal ledger reset to clean initial state successfully',
      });
    }

    if (action === 'import' && importedData && typeof importedData === 'object' && Array.isArray(importedData.wallets)) {
      // Force user ID isolation to prevent account takeover or data leakage
      const sanitizedLedger = {
        ...importedData,
        user: {
          ...(importedData.user || {}),
          id: session.userId,
          email: session.email,
        },
      };
      await saveDbAsync(sanitizedLedger, session.userId);
      return NextResponse.json({
        success: true,
        message: 'Data imported successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or invalid import payload.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Data operation failed' },
      { status: 500 }
    );
  }
}
