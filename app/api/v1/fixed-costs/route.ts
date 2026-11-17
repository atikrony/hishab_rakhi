import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';
import { FixedCost } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDbAsync(session.userId);
    const items: FixedCost[] = db.fixedCosts || [];

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalFixedCost = 0;
    let paidAmount = 0;
    let paidCount = 0;

    items.forEach((item) => {
      const amt = Number(item.amount) || 0;
      totalFixedCost += amt;
      const isPaid = (item.paidMonths || []).includes(currentMonth);
      if (isPaid) {
        paidAmount += amt;
        paidCount++;
      }
    });

    const pendingAmount = Math.max(0, totalFixedCost - paidAmount);
    const pendingCount = items.length - paidCount;

    return NextResponse.json({
      success: true,
      data: {
        items,
        currentMonth,
        totalFixedCost,
        paidAmount,
        pendingAmount,
        paidCount,
        pendingCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch fixed costs' },
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

    const body = await request.json().catch(() => ({}));
    const { title, amount, category, dueDay, notes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const numAmount = Math.round(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid positive amount is required' }, { status: 400 });
    }

    const db = await getDbAsync(session.userId);
    if (!db.fixedCosts) {
      db.fixedCosts = [];
    }

    const newFixedCost: FixedCost = {
      id: `fc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      title: title.trim().substring(0, 100),
      amount: numAmount,
      category: (category || 'Bills & Utilities').trim().substring(0, 50),
      dueDay: dueDay ? Math.min(31, Math.max(1, parseInt(dueDay, 10))) : undefined,
      paidMonths: [],
      notes: notes ? notes.trim().substring(0, 200) : '',
      createdAt: new Date().toISOString(),
    };

    db.fixedCosts.push(newFixedCost);
    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: newFixedCost,
      message: 'Fixed cost created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create fixed cost' },
      { status: 500 }
    );
  }
}

