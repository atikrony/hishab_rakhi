import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, walletId } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Deposit amount must be a positive number' },
        { status: 400 }
      );
    }

    const db = getDb();
    const goal = db.savingsGoals.find((g) => g.id === id);

    if (!goal) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    // Deduct from wallet if specified
    const targetWalletId = walletId || db.wallets[0]?.id;
    const wallet = db.wallets.find((w) => w.id === targetWalletId);
    if (wallet) {
      wallet.balance -= amount;
    }

    goal.currentAmount += amount;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    goal.note = remaining === 0 
      ? '🎉 Goal achieved 100%!' 
      : `$${remaining.toLocaleString()} USD remaining to achieve your goals`;

    saveDb(db);

    return NextResponse.json({
      success: true,
      data: goal,
      message: `Successfully deposited $${amount} into ${goal.title}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to deposit to savings goal' },
      { status: 500 }
    );
  }
}

