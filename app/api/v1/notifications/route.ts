import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const db = await getDbAsync(session.userId);
    const unreadCount = db.notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: db.notifications,
      meta: {
        total: db.notifications.length,
        unreadCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json();
    const { action, id } = body;
    const db = await getDbAsync(session.userId);

    if (action === 'mark_all_read') {
      db.notifications.forEach((n) => (n.read = true));
    } else if (action === 'mark_read' && id) {
      const item = db.notifications.find((n) => n.id === id);
      if (item) item.read = true;
    } else if (action === 'clear_all') {
      db.notifications = [];
    }

    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      message: 'Notifications updated successfully',
      data: db.notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
