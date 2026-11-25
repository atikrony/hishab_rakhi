import type { DatabaseSchema } from './db';

export interface ReceiptItem {
  title: string;
  category: string;
  date: string;
  amount: number;
  recurring?: boolean;
}

export interface MonthReceipt {
  ownerName: string;
  ownerAvatar?: string;
  month: string; // YYYY-MM
  monthLabel: string; // e.g. "November 2026"
  currencySymbol: string;
  total: number;
  count: number;
  categories: { category: string; amount: number; percent: number }[];
  items: ReceiptItem[];
  generatedAt: string;
}

/**
 * Builds a read-only, receipt-style summary of one month's spending.
 * Only expenses are included — no income, balances or wallet details.
 */
export function buildMonthReceipt(db: DatabaseSchema, month: string): MonthReceipt {
  const items: ReceiptItem[] = [];

  for (const t of db.transactions || []) {
    if (t.type !== 'expense' || typeof t.date !== 'string' || !t.date.startsWith(month)) continue;
    items.push({
      title: t.title,
      category: t.category || 'Other',
      date: t.date,
      amount: Math.round(Number(t.amount) || 0),
    });
  }

  // Fixed costs count as spent only in months they were marked paid
  for (const fc of db.fixedCosts || []) {
    if (!(fc.paidMonths || []).includes(month)) continue;
    const day = String(Math.min(28, Math.max(1, fc.dueDay || 1))).padStart(2, '0');
    items.push({
      title: fc.title,
      category: fc.category || 'Bills & Utilities',
      date: `${month}-${day}T09:00:00.000Z`,
      amount: Math.round(Number(fc.amount) || 0),
      recurring: true,
    });
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  const total = items.reduce((s, i) => s + i.amount, 0);

  const byCat = new Map<string, number>();
  for (const i of items) byCat.set(i.category, (byCat.get(i.category) || 0) + i.amount);
  const categories = [...byCat.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const [y, m] = month.split('-').map(Number);
  const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return {
    ownerName: db.user?.name || 'Someone',
    ownerAvatar: db.user?.avatar,
    month,
    monthLabel,
    currencySymbol: db.user?.currencySymbol || '৳',
    total,
    count: items.length,
    categories,
    items,
    generatedAt: new Date().toISOString(),
  };
}
