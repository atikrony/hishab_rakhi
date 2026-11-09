import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { Transaction } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDb();
    let items = [...db.transactions];

    if (q) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      items = items.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    if (type && type !== 'all') {
      items = items.filter((t) => t.type === type);
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      meta: {
        total,
        limit,
        offset,
        count: paginated.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, amount, type, category, date, walletId, notes, brandIcon } = body;

    if (!title || typeof amount !== 'number' || !type || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, amount (number), type (income/expense), category',
        },
        { status: 400 }
      );
    }

    const db = getDb();

    // Determine brand icon automatically if not provided
    let inferredIcon = brandIcon;
    if (!inferredIcon) {
      const lower = title.toLowerCase();
      if (lower.includes('youtube')) inferredIcon = 'youtube';
      else if (lower.includes('apple')) inferredIcon = 'apple';
      else if (lower.includes('food') || lower.includes('coffee') || lower.includes('cafe')) inferredIcon = 'food';
      else if (lower.includes('freelance') || lower.includes('salary') || lower.includes('project')) inferredIcon = 'freelance';
      else inferredIcon = 'default';
    }

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      amount: Math.abs(amount),
      type,
      category,
      date: date || new Date().toISOString(),
      walletId: walletId || db.wallets[0]?.id || 'wal_main',
      notes: notes?.trim() || '',
      brandIcon: inferredIcon,
    };

    // Update wallet balance
    const walletIndex = db.wallets.findIndex((w) => w.id === newTx.walletId);
    if (walletIndex !== -1) {
      if (type === 'income') {
        db.wallets[walletIndex].balance += newTx.amount;
      } else {
        db.wallets[walletIndex].balance -= newTx.amount;
      }
    }

    // Update budget spent if it is an expense
    if (type === 'expense') {
      const budget = db.budgets.find(
        (b) => b.category.toLowerCase() === category.toLowerCase()
      );
      if (budget) {
        budget.spent += newTx.amount;
      }
    }

    // Insert at front
    db.transactions.unshift(newTx);
    saveDb(db);

    return NextResponse.json(
      {
        success: true,
        data: newTx,
        message: 'Transaction created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
