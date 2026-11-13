import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { BudgetLimit } from '@/lib/types';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const db = await getDbAsync(session.userId);

    // Recalculate spent amounts from transactions
    const budgetsWithLiveSpent = db.budgets.map((b) => {
      const spent = db.transactions
        .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);

      const roundedSpent = Math.round(spent);
      const remaining = Math.max(0, b.monthlyLimit - roundedSpent);

      return {
        ...b,
        spent: roundedSpent,
        percentage: Number(((roundedSpent / b.monthlyLimit) * 100).toFixed(1)),
        remaining,
      };
    });

    return NextResponse.json({
      success: true,
      data: budgetsWithLiveSpent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch budgets' },
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
    const { category, monthlyLimit } = body;

    if (!category || typeof monthlyLimit !== 'number' || !Number.isFinite(monthlyLimit) || isNaN(monthlyLimit) || monthlyLimit <= 0 || monthlyLimit > 100000000) {
      return NextResponse.json(
        { success: false, error: 'Category and positive monthlyLimit (under 100,000,000) are required' },
        { status: 400 }
      );
    }

    const cleanCategory = String(category).trim().substring(0, 50);
    const db = await getDbAsync(session.userId);
    const existingIndex = db.budgets.findIndex(
      (b) => b.category.toLowerCase() === cleanCategory.toLowerCase()
    );

    const roundedLimit = Math.round(monthlyLimit);

    if (existingIndex !== -1) {
      db.budgets[existingIndex].monthlyLimit = roundedLimit;
      await saveDbAsync(db, session.userId);
      return NextResponse.json({
        success: true,
        data: db.budgets[existingIndex],
        message: 'Budget updated successfully',
      });
    }

    const newBudget: BudgetLimit = {
      id: `bgt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      category: cleanCategory,
      monthlyLimit: roundedLimit,
      spent: 0,
    };

    db.budgets.push(newBudget);
    await saveDbAsync(db, session.userId);

    return NextResponse.json(
      {
        success: true,
        data: newBudget,
        message: 'Budget created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save budget' },
      { status: 500 }
    );
  }
}
