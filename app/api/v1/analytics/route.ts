import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const db = await getDbAsync(session.userId);
    const transactions = db.transactions;

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenseMap: Record<string, number> = {};
    const categoryIncomeMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        totalExpense += tx.amount;
        categoryExpenseMap[tx.category] = (categoryExpenseMap[tx.category] || 0) + tx.amount;
      } else {
        totalIncome += tx.amount;
        categoryIncomeMap[tx.category] = (categoryIncomeMap[tx.category] || 0) + tx.amount;
      }
    });

    // Formatting category breakdown
    const categoryBreakdown = Object.entries(categoryExpenseMap)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount),
        percentage: totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const savingsRate =
      totalIncome > 0
        ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1))
        : 0;

    // Dynamically calculate the last 6 months from authenticated user's actual ledger transactions
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyOverview: { month: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const monthLabel = monthNames[mo];
      const prefix = `${yr}-${String(mo + 1).padStart(2, '0')}`;

      const mIncome = transactions
        .filter((t) => t.type === 'income' && t.date && t.date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const mExpense = transactions
        .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyOverview.push({
        month: monthLabel,
        income: Math.round(mIncome),
        expense: Math.round(mExpense),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netSavings: Math.max(0, Math.round(totalIncome - totalExpense)),
        savingsRate,
        categoryBreakdown,
        monthlyOverview,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
