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
    const item = db.transactions.find((t) => t.id === id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
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
    const index = db.transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const oldTx = db.transactions[index];
    const newAmount =
      typeof body.amount === 'number' && Number.isFinite(body.amount) && body.amount > 0
        ? Math.round(body.amount)
        : oldTx.amount;

    const diff = newAmount - oldTx.amount;

    // Adjust wallet balance and budget tracking if amount changed
    if (diff !== 0) {
      const wallet = db.wallets.find((w) => w.id === oldTx.walletId);
      if (wallet) {
        if (oldTx.type === 'expense') {
          wallet.balance -= diff;
        } else if (oldTx.type === 'income') {
          wallet.balance += diff;
        }
      }
      if (oldTx.type === 'expense') {
        const budget = db.budgets.find(
          (b) => b.category.toLowerCase() === oldTx.category.toLowerCase()
        );
        if (budget) {
          budget.spent = Math.max(0, budget.spent + diff);
        }
      }
    }

    const updated = {
      ...oldTx,
      title: typeof body.title === 'string' ? body.title.trim().substring(0, 100) : oldTx.title,
      category: typeof body.category === 'string' ? body.category.trim().substring(0, 50) : oldTx.category,
      notes: typeof body.notes === 'string' ? body.notes.trim().substring(0, 500) : oldTx.notes,
      amount: newAmount,
      id: oldTx.id,
      type: oldTx.type,
      walletId: oldTx.walletId,
    };

    db.transactions[index] = updated;
    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Transaction updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
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
    const index = db.transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const removed = db.transactions.splice(index, 1)[0];

    // Reconcile wallet balance and budget spent upon deletion
    const wallet = db.wallets.find((w) => w.id === removed.walletId);
    if (wallet) {
      if (removed.type === 'expense') {
        wallet.balance += removed.amount;
      } else if (removed.type === 'income') {
        wallet.balance -= removed.amount;
      }
    }

    if (removed.type === 'expense') {
      const budget = db.budgets.find(
        (b) => b.category.toLowerCase() === removed.category.toLowerCase()
      );
      if (budget) {
        budget.spent = Math.max(0, budget.spent - removed.amount);
      }
    }

    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: removed,
      message: 'Transaction deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
