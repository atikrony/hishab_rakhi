import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
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
        amount: Number(amount.toFixed(2)),
        percentage: totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const savingsRate =
      totalIncome > 0
        ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1))
        : 0;

    // Monthly breakdown (mock realistic recent 6 months for chart visualization)
    const monthlyOverview = [
      { month: 'Jan', income: 6400, expense: 4200 },
      { month: 'Feb', income: 6800, expense: 4500 },
      { month: 'Mar', income: 7200, expense: 4900 },
      { month: 'Apr', income: 6900, expense: 4600 },
      { month: 'May', income: 7300, expense: 5200 },
      { month: 'Jun', income: totalIncome || 7129.91, expense: totalExpense || 5129.91 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        netSavings: Number((totalIncome - totalExpense).toFixed(2)),
        savingsRate,
        categoryBreakdown,
        monthlyOverview,
        topCategory: categoryBreakdown[0] || null,
        transactionCount: transactions.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

