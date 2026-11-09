import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { SavingsGoal } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json({
      success: true,
      data: db.savingsGoals,
      meta: { count: db.savingsGoals.length },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch savings goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, targetAmount, currentAmount = 0, category, targetDate, note, color } = body;

    if (!title || typeof targetAmount !== 'number' || targetAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and positive targetAmount are required',
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const remaining = Math.max(0, targetAmount - currentAmount);

    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      targetAmount,
      currentAmount: Math.max(0, currentAmount),
      category: category || 'General',
      targetDate: targetDate || '',
      note: note || `$${remaining.toLocaleString()} USD remaining to achieve your goals`,
      color: color || '#079fe9',
    };

    db.savingsGoals.unshift(newGoal);
    saveDb(db);

    return NextResponse.json(
      {
        success: true,
        data: newGoal,
        message: 'Savings goal created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create savings goal' },
      { status: 500 }
    );
  }
}
