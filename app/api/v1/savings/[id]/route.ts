import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(
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
    const goal = db.savingsGoals.find((g) => g.id === id);

    if (!goal) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: goal });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const db = await getDbAsync(session.userId);
    const index = db.savingsGoals.findIndex((g) => g.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    const current = db.savingsGoals[index];
    const updated = {
      ...current,
      title: typeof body.title === 'string' ? body.title.trim().substring(0, 100) : current.title,
      targetAmount: typeof body.targetAmount === 'number' && body.targetAmount > 0 ? Math.round(body.targetAmount) : current.targetAmount,
      currentAmount: typeof body.currentAmount === 'number' && body.currentAmount >= 0 ? Math.round(body.currentAmount) : current.currentAmount,
      category: typeof body.category === 'string' ? body.category.trim().substring(0, 50) : current.category,
      note: typeof body.note === 'string' ? body.note.trim().substring(0, 200) : current.note,
      id: current.id,
    };

    const remaining = Math.max(0, updated.targetAmount - updated.currentAmount);
    updated.note = `৳${remaining.toLocaleString()} remaining to achieve your goals`;

    db.savingsGoals[index] = updated;
    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Savings goal updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
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
    const index = db.savingsGoals.findIndex((g) => g.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    const removed = db.savingsGoals.splice(index, 1)[0];
    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: removed,
      message: 'Savings goal deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
