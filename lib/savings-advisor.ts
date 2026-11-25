import type { DatabaseSchema } from './db';

/**
 * Rule-based savings advisor (no AI, no external calls).
 *
 * 1. Works out monthly income: explicit override > salary from onboarding >
 *    average recorded income.
 * 2. Averages actual spending per category over the last few months, adding
 *    monthly fixed costs (rent, bills…) as committed needs.
 * 3. Splits categories into needs vs wants and fits a 50/30/20-style plan:
 *    needs are kept, wants are trimmed so at least 20% can be saved (never
 *    squeezing wants below 10% of income), and the rest is savings.
 */

export type Bucket = 'needs' | 'wants';

export interface PlanCategory {
  category: string;
  bucket: Bucket;
  current: number; // average per month
  suggested: number;
  change: number; // suggested - current (negative = cut)
}

export interface SavingsPlan {
  income: number;
  incomeSource: 'override' | 'salary' | 'transactions' | 'none';
  monthsAnalyzed: number;
  currentSpend: number;
  currentSavings: number;
  suggestedSavings: number;
  savingsRate: number; // suggested, % of income
  buckets: {
    key: 'needs' | 'wants' | 'savings';
    label: string;
    targetPercent: number;
    current: number;
    suggested: number;
  }[];
  categories: PlanCategory[];
  emergencyFund: { target: number; months: number | null };
  tips: { icon: string; text: string; tone: 'good' | 'warn' | 'info' }[];
}

const NEEDS_HINTS = [
  'bill', 'utilit', 'rent', 'housing', 'home', 'transport', 'commute', 'fuel', 'health', 'med',
  'insurance', 'education', 'school', 'tuition', 'grocer', 'food', 'loan', 'emi', 'telecom', 'internet',
];

export function bucketFor(category: string): Bucket {
  const c = category.toLowerCase();
  if (c.includes('dining out') || c.includes('restaurant')) return 'wants';
  return NEEDS_HINTS.some((h) => c.includes(h)) ? 'needs' : 'wants';
}

const round = (n: number) => Math.round(n);
const roundTo = (n: number, step = 50) => Math.round(n / step) * step;

function monthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export function buildSavingsPlan(
  db: DatabaseSchema,
  opts: { incomeOverride?: number; salary?: number; windowMonths?: number; now?: Date } = {}
): SavingsPlan {
  const now = opts.now || new Date();
  const window = monthKeys(opts.windowMonths || 3, now);
  const inWindow = (date: string) => window.some((k) => date?.startsWith(k));

  const txs = (db.transactions || []).filter((t) => typeof t.date === 'string' && inWindow(t.date));
  const expenses = txs.filter((t) => t.type === 'expense');
  const incomes = txs.filter((t) => t.type === 'income');

  // Months that actually have activity (so a new user isn't averaged over empty months)
  const activeMonths = new Set(txs.map((t) => t.date.slice(0, 7)));
  const months = Math.max(1, activeMonths.size);

  // ---- Income -------------------------------------------------------------
  let income = 0;
  let incomeSource: SavingsPlan['incomeSource'] = 'none';
  if (opts.incomeOverride && opts.incomeOverride > 0) {
    income = opts.incomeOverride;
    incomeSource = 'override';
  } else if ((opts.salary || db.user?.monthlyIncome || 0) > 0) {
    income = Number(opts.salary || db.user.monthlyIncome);
    incomeSource = 'salary';
  } else if (incomes.length) {
    const incomeMonths = Math.max(1, new Set(incomes.map((t) => t.date.slice(0, 7))).size);
    income = incomes.reduce((s, t) => s + (Number(t.amount) || 0), 0) / incomeMonths;
    incomeSource = 'transactions';
  }
  income = round(income);

  // ---- Average monthly spend per category ---------------------------------
  const perCat = new Map<string, number>();
  for (const t of expenses) {
    const cat = t.category || 'Other';
    perCat.set(cat, (perCat.get(cat) || 0) + (Number(t.amount) || 0) / months);
  }
  // Fixed costs are monthly commitments, whether or not this month is paid yet
  for (const fc of db.fixedCosts || []) {
    const cat = fc.category || 'Bills & Utilities';
    perCat.set(cat, (perCat.get(cat) || 0) + (Number(fc.amount) || 0));
  }

  const rows = [...perCat.entries()]
    .map(([category, amount]) => ({ category, bucket: bucketFor(category), current: round(amount) }))
    .filter((r) => r.current > 0);

  const needs = rows.filter((r) => r.bucket === 'needs').reduce((s, r) => s + r.current, 0);
  const wants = rows.filter((r) => r.bucket === 'wants').reduce((s, r) => s + r.current, 0);
  const currentSpend = needs + wants;
  const currentSavings = income - currentSpend;

  // ---- Fit the plan ---------------------------------------------------------
  let wantsCap = Math.max(0, income * 0.8 - needs); // leaves 20% for savings
  if (wantsCap < income * 0.1 && needs < income * 0.9) wantsCap = income * 0.1; // keep some breathing room
  const wantsSuggested = income > 0 ? Math.min(wants, wantsCap) : wants;
  const scale = wants > 0 ? wantsSuggested / wants : 1;

  const categories: PlanCategory[] = rows
    .map((r) => {
      const suggested = r.bucket === 'wants' && scale < 1 ? roundTo(r.current * scale) : r.current;
      return { ...r, suggested, change: suggested - r.current };
    })
    .sort((a, b) => b.current - a.current);

  const suggestedSpend = categories.reduce((s, c) => s + c.suggested, 0);
  const suggestedSavings = Math.max(0, income - suggestedSpend);
  const savingsRate = income > 0 ? Math.round((suggestedSavings / income) * 100) : 0;

  const buckets: SavingsPlan['buckets'] = [
    { key: 'needs', label: 'Needs', targetPercent: 50, current: needs, suggested: needs },
    { key: 'wants', label: 'Wants', targetPercent: 30, current: wants, suggested: round(wantsSuggested) },
    {
      key: 'savings',
      label: 'Savings',
      targetPercent: 20,
      current: Math.max(0, round(currentSavings)),
      suggested: suggestedSavings,
    },
  ];

  // ---- Emergency fund: 6 months of needs ------------------------------------
  const efTarget = roundTo(needs * 6, 500);
  const emergencyFund = {
    target: efTarget,
    months: suggestedSavings > 0 && efTarget > 0 ? Math.ceil(efTarget / suggestedSavings) : null,
  };

  // ---- Tips -------------------------------------------------------------------
  const tips: SavingsPlan['tips'] = [];
  const pct = (n: number) => (income > 0 ? Math.round((n / income) * 100) : 0);

  if (income <= 0) {
    tips.push({ icon: 'payments', tone: 'info', text: 'Enter your monthly income above to get a personalised plan.' });
  } else {
    if (currentSpend > income) {
      tips.push({
        icon: 'warning',
        tone: 'warn',
        text: `You spend ৳${round(currentSpend - income).toLocaleString()} more than you earn each month.`,
      });
    }
    const cuts = categories.filter((c) => c.change < 0).slice(0, 3);
    for (const c of cuts) {
      tips.push({
        icon: 'content_cut',
        tone: 'warn',
        text: `Cut ${c.category} from ৳${c.current.toLocaleString()} to ৳${c.suggested.toLocaleString()} (save ৳${Math.abs(c.change).toLocaleString()}).`,
      });
    }
    if (pct(needs) > 50) {
      const flexible = categories.find((c) => c.bucket === 'needs' && !/rent|housing|loan|emi|insurance/i.test(c.category));
      tips.push({
        icon: 'home',
        tone: 'info',
        text: `Needs take ${pct(needs)}% of income (aim for 50%).${
          flexible ? ` Look for savings in ${flexible.category}.` : ''
        }`,
      });
    }
    if (savingsRate >= 20 && cuts.length === 0) {
      tips.push({ icon: 'celebration', tone: 'good', text: `Nice — you can save ${savingsRate}% of your income without cutting anything.` });
    }
    if (emergencyFund.months) {
      tips.push({
        icon: 'savings',
        tone: 'info',
        text: `Build a ৳${efTarget.toLocaleString()} emergency fund (6 months of needs) in about ${emergencyFund.months} months.`,
      });
    }
  }
  if (activeMonths.size < 2) {
    tips.push({ icon: 'insights', tone: 'info', text: 'Suggestions get more accurate as you record more months of spending.' });
  }

  return {
    income,
    incomeSource,
    monthsAnalyzed: activeMonths.size,
    currentSpend: round(currentSpend),
    currentSavings: round(currentSavings),
    suggestedSavings,
    savingsRate,
    buckets,
    categories,
    emergencyFund,
    tips,
  };
}
