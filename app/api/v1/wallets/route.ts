import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { WalletAccount } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const totalBalance = db.wallets.reduce((sum, w) => sum + w.balance, 0);

    return NextResponse.json({
      success: true,
      data: db.wallets,
      meta: {
        count: db.wallets.length,
        totalBalance,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type = 'bank', balance = 0, accountNumber, color = '#079be8' } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Wallet name is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const newWallet: WalletAccount = {
      id: `wal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      type,
      balance: Number(balance) || 0,
      accountNumber: accountNumber || `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
      color,
    };

    db.wallets.push(newWallet);
    saveDb(db);

    return NextResponse.json(
      {
        success: true,
        data: newWallet,
        message: 'Wallet created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create wallet' },
      { status: 500 }
    );
  }
}
