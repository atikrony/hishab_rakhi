import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { Transaction } from '@/lib/types';
import { sanitizeString, sanitizeAmount, checkRateLimit, getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`tx_get_${session.userId}`, 120, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please throttle requests.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = sanitizeString(searchParams.get('q') || '', 100).toLowerCase();
    const category = sanitizeString(searchParams.get('category') || '', 50);
    const type = sanitizeString(searchParams.get('type') || '', 20);
    // `limit=all` returns every transaction (the app needs the full history)
    const rawLimit = searchParams.get('limit');
    const limit =
      rawLimit === 'all'
        ? Number.MAX_SAFE_INTEGER
        : Math.min(100, Math.max(1, parseInt(rawLimit || '50', 10) || 50));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const db = await getDbAsync(session.userId);
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`tx_post_${session.userId}`, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many transactions submitted. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      amount,
      type,
      category,
      date,
      walletId,
      notes,
      brandIcon,
      paymentMethod,
      sourceStream,
      channel,
      status,
    } = body;

    const cleanTitle = sanitizeString(title, 100);
    const validAmount = sanitizeAmount(amount);

    if (!cleanTitle || validAmount === null || !type || !category) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid or missing fields. Ensure title (max 100 chars), valid positive amount (e.g. 10.50), type (income/expense), and category are provided.',
        },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type: must be "income" or "expense"' },
        { status: 400 }
      );
    }

    // Validate date - future dates are strictly disallowed
    let txDate = new Date();
    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date provided.' },
          { status: 400 }
        );
      }
      if (parsed.getTime() > Date.now() + 60000) {
        return NextResponse.json(
          { success: false, error: 'Future dates are not permitted. Please select today or a past date.' },
          { status: 400 }
        );
      }
      txDate = parsed;
    }

    const db = await getDbAsync(session.userId);

    // Determine brand icon automatically if not provided
    let inferredIcon = brandIcon;
    if (!inferredIcon) {
      const lower = cleanTitle.toLowerCase();
      if (lower.includes('tech') || lower.includes('laptop') || lower.includes('freelance')) inferredIcon = 'laptop_mac';
      else if (lower.includes('salary') || lower.includes('payroll') || lower.includes('work')) inferredIcon = 'corporate_fare';
      else if (lower.includes('gift') || lower.includes('birthday')) inferredIcon = 'featured_seasonal_and_gifts';
      else if (lower.includes('invest') || lower.includes('yield') || lower.includes('dividend')) inferredIcon = 'show_chart';
      else if (lower.includes('grocery') || lower.includes('market') || lower.includes('store')) inferredIcon = 'local_grocery_store';
      else if (lower.includes('uber') || lower.includes('ride') || lower.includes('transit')) inferredIcon = 'commute';
      else if (lower.includes('internet') || lower.includes('wifi') || lower.includes('fiber')) inferredIcon = 'wifi';
      else if (lower.includes('coffee') || lower.includes('cafe') || lower.includes('bakery')) inferredIcon = 'local_cafe';
      else if (lower.includes('pharmacy') || lower.includes('health') || lower.includes('med')) inferredIcon = 'prescriptions';
      else if (lower.includes('restaurant') || lower.includes('dinner') || lower.includes('food')) inferredIcon = 'restaurant';
      else inferredIcon = type === 'income' ? 'south_west' : 'receipt_long';
    }

    const cleanNotes = sanitizeString(notes, 500);
    const cleanCategory = sanitizeString(category, 50);
    const cleanPaymentMethod = sanitizeString(
      paymentMethod,
      50,
      type === 'income' ? 'Direct Deposit' : 'Cash'
    );
    const cleanSourceStream = sanitizeString(sourceStream, 50, cleanCategory);
    const cleanChannel = sanitizeString(
      channel,
      80,
      type === 'income' ? `${cleanTitle} Transfer` : 'Direct Payment'
    );

    const safeWalletId = (walletId && db.wallets.find((w) => w.id === walletId) ? walletId : db.wallets[0]?.id) || 'wal_pocket';

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      title: cleanTitle,
      amount: validAmount,
      type,
      category: cleanCategory,
      date: txDate.toISOString(),
      walletId: safeWalletId,
      notes: cleanNotes,
      paymentMethod: cleanPaymentMethod,
      sourceStream: cleanSourceStream,
      channel: cleanChannel,
      status: status === 'Pending' ? 'Pending' : 'Completed',
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
    await saveDbAsync(db, session.userId);

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

