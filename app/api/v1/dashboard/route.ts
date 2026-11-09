import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/db';

export async function GET() {
  try {
    const summary = getDashboardSummary();
    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Dashboard summary retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.0.0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve dashboard',
      },
      { status: 500 }
    );
  }
}
