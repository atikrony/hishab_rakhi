import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function POST(
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
    const { amount, walletId } = body;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || isNaN(amount) || amount <= 0 || amount > 100000000) {
      return NextResponse.json(
        { success: false, error: 'Deposit amount must be a positive number under 100,000,000' },
        { status: 400 }
      );
    }

    const roundedAmount = Math.round(amount);
    const db = await getDbAsync(session.userId);
    const goal = db.savingsGoals.find((g) => g.id === id);

    if (!goal) {
      return NextResponse.json({ success: false, error: 'Savings goal not found' }, { status: 404 });
    }

    // Deduct from wallet if specified
    const targetWalletId = walletId || db.wallets[0]?.id;
    const wallet = db.wallets.find((w) => w.id === targetWalletId);
    if (wallet) {
      if (wallet.balance < roundedAmount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds in the selected wallet.' },
          { status: 400 }
        );
      }
      wallet.balance -= roundedAmount;
    }

    goal.currentAmount += roundedAmount;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    goal.note = remaining === 0 
      ? '🎉 Goal achieved 100%!' 
      : `৳${remaining.toLocaleString()} remaining to achieve your goal`;

    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: goal,
      message: `Successfully deposited ৳${roundedAmount.toLocaleString()} into ${goal.title}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to deposit to savings goal' },
      { status: 500 }
    );
  }
}
