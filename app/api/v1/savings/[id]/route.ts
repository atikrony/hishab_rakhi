import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const goal = db.savingsGoals.find((g) => g.id === id);

    if (!goal) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: goal });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();
    const index = db.savingsGoals.findIndex((g) => g.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    const current = db.savingsGoals[index];
    const updated = {
      ...current,
      ...body,
      id: current.id,
    };

    const remaining = Math.max(0, updated.targetAmount - updated.currentAmount);
    updated.note = `$${remaining.toLocaleString()} USD remaining to achieve your goals`;

    db.savingsGoals[index] = updated;
    saveDb(db);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Savings goal updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const index = db.savingsGoals.findIndex((g) => g.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    const removed = db.savingsGoals.splice(index, 1)[0];
    saveDb(db);

    return NextResponse.json({
      success: true,
      data: removed,
      message: 'Savings goal deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

