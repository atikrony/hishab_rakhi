import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { BudgetLimit } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();

    // Recalculate spent amounts from transactions
    const budgetsWithLiveSpent = db.budgets.map((b) => {
      const spent = db.transactions
        .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...b,
        spent: Number(spent.toFixed(2)),
        percentage: Number(((spent / b.monthlyLimit) * 100).toFixed(1)),
        remaining: Math.max(0, Number((b.monthlyLimit - spent).toFixed(2))),
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
    const body = await request.json();
    const { category, monthlyLimit } = body;

    if (!category || typeof monthlyLimit !== 'number' || monthlyLimit <= 0) {
      return NextResponse.json(
        { success: false, error: 'Category and positive monthlyLimit are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const existingIndex = db.budgets.findIndex(
      (b) => b.category.toLowerCase() === category.toLowerCase()
    );

    if (existingIndex !== -1) {
      db.budgets[existingIndex].monthlyLimit = monthlyLimit;
    } else {
      const newBudget: BudgetLimit = {
        id: `bgt_${Date.now()}`,
        category,
        monthlyLimit,
        spent: 0,
      };
      db.budgets.push(newBudget);
    }

    saveDb(db);

    return NextResponse.json({
      success: true,
      message: 'Budget saved successfully',
      data: db.budgets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save budget' },
      { status: 500 }
    );
  }
}
