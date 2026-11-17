import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordVisit, getVisitorAnalytics } from '@/lib/visitor';

const VISITOR_COOKIE_NAME = 'hr_visitor_id';

export async function POST(request: NextRequest) {
  try {
    let visitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
    let isNewVisitorCookie = false;

    if (!visitorId || visitorId.length < 8) {
      visitorId = `vid_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      isNewVisitorCookie = true;
    }

    const body = await request.json().catch(() => ({}));
    const pagePath = typeof body.path === 'string' ? body.path.substring(0, 100) : '/';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const analytics = recordVisit({
      path: pagePath,
      visitorId,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        totalVisits: analytics.totalVisits,
        uniqueVisitors: analytics.uniqueVisitors,
        todayVisits: analytics.todayVisits,
      },
    });

    if (isNewVisitorCookie) {
      response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 3600, // 1 year
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to record visit' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const analytics = getVisitorAnalytics();
  return NextResponse.json({
    success: true,
    data: {
      totalVisits: analytics.totalVisits,
      uniqueVisitors: analytics.uniqueVisitors,
      todayVisits: analytics.todayVisits,
    },
  });
}

