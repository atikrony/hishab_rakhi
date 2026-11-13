import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { WalletAccount } from '@/lib/types';
import { getSessionFromRequest, maskAccountNumber, sanitizeString } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const db = await getDbAsync(session.userId);
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
      { success: false, error: 'Failed to fetch wallets' },
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
    const { name, type = 'bank', balance = 0, accountNumber, color = '#079be8' } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Wallet name is required' },
        { status: 400 }
      );
    }

    const db = await getDbAsync(session.userId);
    const allowedTypes = ['bank', 'cash', 'digital', 'investment'];
    const safeType = allowedTypes.includes(type) ? type : 'bank';
    const randomSuffix = crypto.randomInt(1000, 9999).toString();
    const safeAccountNumber = accountNumber ? maskAccountNumber(accountNumber) : `•••• ${randomSuffix}`;

    const newWallet: WalletAccount = {
      id: `wal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: sanitizeString(name, 80),
      type: safeType as any,
      balance: Math.round(Number(balance) || 0),
      accountNumber: safeAccountNumber,
      color: typeof color === 'string' && color.startsWith('#') ? color.substring(0, 7) : '#079be8',
    };

    db.wallets.push(newWallet);
    await saveDbAsync(db, session.userId);

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
