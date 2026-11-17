import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const db = await getDbAsync(session.userId);

    if (!db.fixedCosts) {
      db.fixedCosts = [];
    }

    const index = db.fixedCosts.findIndex((fc) => fc.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Fixed cost item not found' }, { status: 404 });
    }

    const item = db.fixedCosts[index];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = body.month || currentMonth;

    // Check if toggling paid status
    if (typeof body.isPaid === 'boolean') {
      const currentPaidMonths = new Set(item.paidMonths || []);
      if (body.isPaid) {
        currentPaidMonths.add(targetMonth);
      } else {
        currentPaidMonths.delete(targetMonth);
      }
      item.paidMonths = Array.from(currentPaidMonths);
    }

    // Check if updating attributes
    if (typeof body.title === 'string' && body.title.trim()) {
      item.title = body.title.trim().substring(0, 100);
    }
    if (typeof body.amount === 'number' && body.amount > 0) {
      item.amount = Math.round(body.amount);
    }
    if (typeof body.category === 'string' && body.category.trim()) {
      item.category = body.category.trim().substring(0, 50);
    }
    if (body.dueDay !== undefined) {
      item.dueDay = body.dueDay ? Math.min(31, Math.max(1, parseInt(body.dueDay, 10))) : undefined;
    }
    if (typeof body.notes === 'string') {
      item.notes = body.notes.trim().substring(0, 200);
    }

    db.fixedCosts[index] = item;
    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Fixed cost updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update fixed cost' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDbAsync(session.userId);

    if (!db.fixedCosts) {
      db.fixedCosts = [];
    }

    const initialLength = db.fixedCosts.length;
    db.fixedCosts = db.fixedCosts.filter((fc) => fc.id !== id);

    if (db.fixedCosts.length === initialLength) {
      return NextResponse.json({ success: false, error: 'Fixed cost item not found' }, { status: 404 });
    }

    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      message: 'Fixed cost deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete fixed cost' },
      { status: 500 }
    );
  }
}

