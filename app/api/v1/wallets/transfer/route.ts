import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromWalletId, toWalletId, amount, note } = body;

    if (!fromWalletId || !toWalletId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'fromWalletId, toWalletId, and positive amount are required' },
        { status: 400 }
      );
    }

    if (fromWalletId === toWalletId) {
      return NextResponse.json(
        { success: false, error: 'Cannot transfer to the same wallet' },
        { status: 400 }
      );
    }

    const db = getDb();
    const fromWallet = db.wallets.find((w) => w.id === fromWalletId);
    const toWallet = db.wallets.find((w) => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      return NextResponse.json(
        { success: false, error: 'One or both wallets not found' },
        { status: 404 }
      );
    }

    if (fromWallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds in source wallet' },
        { status: 400 }
      );
    }

    fromWallet.balance -= amount;
    toWallet.balance += amount;

    // Record notification/log
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Wallet Transfer',
      message: `Transferred $${amount} from ${fromWallet.name} to ${toWallet.name}. ${note ? `(${note})` : ''}`,
      date: new Date().toISOString(),
      read: false,
      type: 'info',
    });

    saveDb(db);

    return NextResponse.json({
      success: true,
      data: {
        fromWallet,
        toWallet,
        transferredAmount: amount,
      },
      message: `Successfully transferred $${amount} from ${fromWallet.name} to ${toWallet.name}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Transfer failed' },
      { status: 500 }
    );
  }
}
