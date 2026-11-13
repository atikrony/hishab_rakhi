import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummaryAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const summary = await getDashboardSummaryAsync(session.userId);

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Dashboard summary retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.0.0',
        userId: session.userId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve dashboard',
      },
      { status: 500 }
    );
  }
}
