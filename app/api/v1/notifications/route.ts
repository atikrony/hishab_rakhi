import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
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
      { success: false, error: error?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;
    const db = getDb();

    if (action === 'mark_all_read') {
      db.notifications.forEach((n) => (n.read = true));
    } else if (action === 'mark_read' && id) {
      const item = db.notifications.find((n) => n.id === id);
      if (item) item.read = true;
    } else if (action === 'clear_all') {
      db.notifications = [];
    }

    saveDb(db);

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
