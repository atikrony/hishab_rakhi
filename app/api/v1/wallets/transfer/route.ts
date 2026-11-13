import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json();
    const { fromWalletId, toWalletId, amount, note } = body;

    if (
      !fromWalletId ||
      !toWalletId ||
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      isNaN(amount) ||
      amount <= 0 ||
      amount > 100000000
    ) {
      return NextResponse.json(
        { success: false, error: 'Valid positive amount (max 100,000,000) and wallet IDs are required' },
        { status: 400 }
      );
    }

    if (fromWalletId === toWalletId) {
      return NextResponse.json(
        { success: false, error: 'Cannot transfer to the same wallet' },
        { status: 400 }
      );
    }

    const db = await getDbAsync(session.userId);
    const fromWallet = db.wallets.find((w) => w.id === fromWalletId);
    const toWallet = db.wallets.find((w) => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      return NextResponse.json(
        { success: false, error: 'One or both wallets not found' },
        { status: 404 }
      );
    }

    const roundedAmount = Math.round(amount);

    if (fromWallet.balance < roundedAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds in source wallet' },
        { status: 400 }
      );
    }

    fromWallet.balance -= roundedAmount;
    toWallet.balance += roundedAmount;

    // Record notification/log
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Wallet Transfer',
      message: `Transferred ৳${roundedAmount} from ${fromWallet.name} to ${toWallet.name}. ${note ? `(${note})` : ''}`,
      date: new Date().toISOString(),
      read: false,
      type: 'info',
    });

    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: {
        fromWallet,
        toWallet,
        amount: roundedAmount,
      },
      message: 'Funds transferred successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Transfer failed' },
      { status: 500 }
    );
  }
}
