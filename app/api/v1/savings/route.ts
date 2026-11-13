import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { SavingsGoal } from '@/lib/types';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const db = await getDbAsync(session.userId);
    return NextResponse.json({
      success: true,
      data: db.savingsGoals,
      meta: { count: db.savingsGoals.length },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch savings goals' },
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
    const { title, targetAmount, currentAmount = 0, category, targetDate, note, color } = body;

    if (!title || typeof targetAmount !== 'number' || !Number.isFinite(targetAmount) || isNaN(targetAmount) || targetAmount <= 0 || targetAmount > 100000000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and positive targetAmount (under 100,000,000) are required',
        },
        { status: 400 }
      );
    }

    const db = await getDbAsync(session.userId);
    const roundedTarget = Math.round(targetAmount);
    const roundedCurrent = Math.round(Math.max(0, currentAmount));
    const remaining = Math.max(0, roundedTarget - roundedCurrent);

    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      title: String(title).trim().substring(0, 100),
      targetAmount: roundedTarget,
      currentAmount: roundedCurrent,
      category: category ? String(category).trim().substring(0, 50) : 'General',
      targetDate: targetDate || '',
      note: note ? String(note).trim().substring(0, 200) : `৳${remaining.toLocaleString()} remaining to achieve your goal`,
      color: color || '#079fe9',
    };

    db.savingsGoals.unshift(newGoal);
    await saveDbAsync(db, session.userId);

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
