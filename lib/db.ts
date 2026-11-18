import path from 'path';
import {
  getDataStorageDirectory,
  getUserLedgersDirectory,
  safeReadJson,
  safeWriteJson,
  getMemoryStore,
  readUserLedgerData,
  writeUserLedgerData,
} from './storage';
import {
  UserProfile,
  Transaction,
  SavingsGoal,
  WalletAccount,
  BudgetLimit,
  NotificationItem,
  DashboardSummary,
  FixedCost,
} from './types';

export interface DatabaseSchema {
  user: UserProfile;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  wallets: WalletAccount[];
  budgets: BudgetLimit[];
  notifications: NotificationItem[];
  fixedCosts?: FixedCost[];
}

const defaultAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAGbe-PGr5FQv2oeTce8zWB0Rhh8gLQWtLLOSGRW2FKp1bwXwnCcWU0lR4hMV1MdQAaBamQvkWdPLbeuAnN8DD4HJCgzggnnEgNT5GyNl0LO7KqelGlysdZnh2Wa4FHMx4Inu5VyOMi4blUPrrWF20O4qENbQag0AkgsI7Pdqj3uY6cmXxnX5n3StoThWFweCLXBa5-clEAH9HP9JYdRKIjuRmcA9OwnNSCUYgg6S0m';

export const dummyInitialData: DatabaseSchema = {
  user: {
    id: 'usr_atiqur_01',
    name: 'Atiqur',
    email: 'atiqur@hishabrakhi.com',
    avatar: defaultAvatar,
    plan: 'Premium Plan',
    currency: 'BDT',
    currencySymbol: '৳',
  },
  wallets: [
    {
      id: 'wal_pocket',
      name: 'Main Pocket (Checking)',
      type: 'bank',
      balance: 1000,
      accountNumber: '•••• 4420',
      color: '#16a36a',
    },
    {
      id: 'wal_vault',
      name: 'Reserve Vault',
      type: 'digital',
      balance: 850,
      accountNumber: '•••• 9811',
      color: '#006d44',
    },
    {
      id: 'wal_tax',
      name: 'Tax Escrow',
      type: 'bank',
      balance: 500,
      accountNumber: '•••• 3190',
      color: '#f59e0b',
    },
  ],
  savingsGoals: [
    {
      id: 'goal_01',
      title: 'Tax Escrow Reserve',
      targetAmount: 5000,
      currentAmount: 2500,
      category: 'Safety',
      targetDate: '2026-12-31',
      note: '৳2,500 BDT remaining for annual tax balance',
      color: '#16a36a',
    },
    {
      id: 'goal_02',
      title: 'Tech Hardware Upgrade',
      targetAmount: 2000,
      currentAmount: 1400,
      category: 'Electronics',
      targetDate: '2026-11-30',
      note: '৳600 remaining to purchase M4 Max workstation',
      color: '#079fe9',
    },
  ],
  transactions: [
    // --- Inflows (৳2,500 Total) ---
    {
      id: 'tx_in_01',
      title: 'Tech Corp',
      amount: 750,
      type: 'income',
      category: 'Freelance',
      date: '2026-11-10T14:30:00Z',
      walletId: 'wal_pocket',
      notes: 'Direct Wire ACH • Invoice #TC-9921',
      channel: 'Direct Wire ACH • Invoice #TC-9921',
      sourceStream: 'Freelance',
      paymentMethod: 'Direct Wire ACH',
      status: 'Completed',
      brandIcon: 'laptop_mac',
    },
    {
      id: 'tx_in_02',
      title: 'Monthly Salary',
      amount: 1500,
      type: 'income',
      category: 'Salary',
      date: '2026-11-06T09:00:00Z', // Wednesday peak
      walletId: 'wal_pocket',
      notes: 'Apex Labs Ltd • Direct Deposit Primary Payroll',
      channel: 'Apex Labs Ltd • Direct Deposit',
      sourceStream: 'Salary',
      paymentMethod: 'Direct Deposit',
      status: 'Completed',
      brandIcon: 'corporate_fare',
    },
    {
      id: 'tx_in_03',
      title: 'Birthday Gift',
      amount: 100,
      type: 'income',
      category: 'Gift',
      date: '2026-10-28T16:15:00Z',
      walletId: 'wal_pocket',
      notes: 'Sent from family via instant bank transfer with celebration note',
      channel: 'Sent via Zelle Instant',
      sourceStream: 'Gifts & Family',
      paymentMethod: 'Zelle Instant',
      status: 'Completed',
      brandIcon: 'featured_seasonal_and_gifts',
    },
    {
      id: 'tx_in_04',
      title: 'Asset Yield',
      amount: 150,
      type: 'income',
      category: 'Investment',
      date: '2026-10-22T11:00:00Z',
      walletId: 'wal_pocket',
      notes: 'Quarterly index fund dividend reinvestment allocation',
      channel: 'Vanguard Index Yield Distribution',
      sourceStream: 'Investment',
      paymentMethod: 'ACH Direct',
      status: 'Completed',
      brandIcon: 'show_chart',
    },

    // --- Outflows (৳650 Total) ---
    {
      id: 'tx_out_01',
      title: 'Artisan Grocery & Market',
      amount: 85,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-11-10T14:24:00Z',
      walletId: 'wal_pocket',
      notes: 'Groceries • Organic produce & pantry supply',
      paymentMethod: 'Apple Pay (Debit)',
      status: 'Completed',
      brandIcon: 'local_grocery_store',
    },
    {
      id: 'tx_out_02',
      title: 'Uber Ride',
      amount: 20,
      type: 'expense',
      category: 'Transportation',
      date: '2026-11-09T08:45:00Z',
      walletId: 'wal_pocket',
      notes: 'Office meeting transit • Downtown trip',
      paymentMethod: 'Credit Card (*4921)',
      status: 'Completed',
      brandIcon: 'commute',
    },
    {
      id: 'tx_out_03',
      title: 'Internet Bill - Fiber',
      amount: 45,
      type: 'expense',
      category: 'Bills & Utilities',
      date: '2026-11-08T00:01:00Z',
      walletId: 'wal_pocket',
      notes: 'Monthly 1 Gbps broadband connection',
      paymentMethod: 'Auto-debit (Checking)',
      status: 'Completed',
      brandIcon: 'wifi',
    },
    {
      id: 'tx_out_04',
      title: 'Coffee & Bakery',
      amount: 12,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-11-07T09:12:00Z',
      walletId: 'wal_pocket',
      notes: 'Morning espresso & fresh croissant',
      paymentMethod: 'Cash Pocket',
      status: 'Completed',
      brandIcon: 'local_cafe',
    },
    {
      id: 'tx_out_05',
      title: 'USB-C Dock',
      amount: 110,
      type: 'expense',
      category: 'Tech & Gadgets',
      date: '2026-11-05T17:30:00Z',
      walletId: 'wal_pocket',
      notes: 'Dual display 100W USB-C charging dock',
      paymentMethod: 'Digital Wallet',
      status: 'Completed',
      brandIcon: 'hub',
    },
    {
      id: 'tx_out_06',
      title: 'Pharmacy',
      amount: 32,
      type: 'expense',
      category: 'Health & Meds',
      date: '2026-11-04T11:20:00Z',
      walletId: 'wal_pocket',
      notes: 'Prescription vitamins & daily wellness care',
      paymentMethod: 'Health HSA Debit',
      status: 'Completed',
      brandIcon: 'prescriptions',
    },
    {
      id: 'tx_out_07',
      title: 'Bistro Team Dinner',
      amount: 94,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-11-03T19:30:00Z',
      walletId: 'wal_pocket',
      notes: 'Weekly team sprint dinner and celebration',
      paymentMethod: 'Apple Pay',
      status: 'Completed',
      brandIcon: 'restaurant',
    },
    {
      id: 'tx_out_08',
      title: 'Artisan Roast & Provisions',
      amount: 49,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-11-02T11:22:00Z',
      walletId: 'wal_pocket',
      notes: 'Espresso beans & team brunch',
      paymentMethod: 'Debit ••4109',
      status: 'Completed',
      brandIcon: 'local_cafe',
    },
    {
      id: 'tx_out_09',
      title: 'Vercel & Supabase Infra',
      amount: 70,
      type: 'expense',
      category: 'Tech & Gadgets',
      date: '2026-11-01T15:00:00Z',
      walletId: 'wal_pocket',
      notes: 'Cloud hosting serverless compute and database replica',
      paymentMethod: 'Chase Debit',
      status: 'Completed',
      brandIcon: 'terminal',
    },
    {
      id: 'tx_out_10',
      title: 'Power & Electricity Grid',
      amount: 75,
      type: 'expense',
      category: 'Bills & Utilities',
      date: '2026-10-31T08:00:00Z',
      walletId: 'wal_pocket',
      notes: 'City grid green energy power utility billing',
      paymentMethod: 'Auto-debit',
      status: 'Completed',
      brandIcon: 'bolt',
    },
    {
      id: 'tx_out_11',
      title: 'Metro Commuter Pass',
      amount: 58,
      type: 'expense',
      category: 'Transportation',
      date: '2026-10-30T07:45:00Z',
      walletId: 'wal_pocket',
      notes: 'Subway & commuter rapid rail reload',
      paymentMethod: 'Apple Pay',
      status: 'Completed',
      brandIcon: 'directions_car',
    },
  ],
  budgets: [
    {
      id: 'bgt_food',
      category: 'Food & Dining',
      monthlyLimit: 350,
      spent: 240,
    },
    {
      id: 'bgt_tech',
      category: 'Tech & Gadgets',
      monthlyLimit: 250,
      spent: 180,
    },
    {
      id: 'bgt_util',
      category: 'Bills & Utilities',
      monthlyLimit: 150,
      spent: 120,
    },
    {
      id: 'bgt_trans',
      category: 'Transportation',
      monthlyLimit: 150,
      spent: 78,
    },
    {
      id: 'bgt_health',
      category: 'Health & Meds',
      monthlyLimit: 100,
      spent: 32,
    },
  ],
  notifications: [
    {
      id: 'notif_01',
      title: 'Wire Settled',
      message: 'Tech Corp invoice #TC-9921 (+৳750) completed ACH clearance.',
      date: '2026-11-10T14:30:00Z',
      read: false,
      type: 'success',
    },
    {
      id: 'notif_02',
      title: 'Ledger Connected',
      message: 'Ledger reconciliation active and up to date.',
      date: '2026-11-10T08:00:00Z',
      read: false,
      type: 'info',
    },
    {
      id: 'notif_03',
      title: 'Solvency Status',
      message: 'Solvency Grade: Optimal.',
      date: '2026-11-09T00:00:00Z',
      read: true,
      type: 'success',
    },
  ],
  fixedCosts: [],
};

export const realInitialData: DatabaseSchema = {
  user: {
    id: 'usr_guest',
    name: 'Solo User',
    email: 'user@hishabrakhi.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=User',
    plan: 'Solo Ledger',
    currency: 'BDT',
    currencySymbol: '৳',
  },
  wallets: [
    {
      id: 'wal_pocket',
      name: 'Main Pocket (Checking)',
      type: 'bank',
      balance: 0,
      accountNumber: '•••• 0001',
      color: '#16a36a',
    },
    {
      id: 'wal_vault',
      name: 'Reserve Vault',
      type: 'digital',
      balance: 0,
      accountNumber: '•••• 0002',
      color: '#006d44',
    },
    {
      id: 'wal_cash',
      name: 'Cash In Hand',
      type: 'cash',
      balance: 0,
      accountNumber: 'Cash Wallet',
      color: '#f59e0b',
    },
  ],
  transactions: [],
  savingsGoals: [],
  budgets: [
    {
      id: 'b_food',
      category: 'Food & Dining',
      monthlyLimit: 15000,
      spent: 0,
    },
    {
      id: 'b_util',
      category: 'Utilities',
      monthlyLimit: 5000,
      spent: 0,
    },
    {
      id: 'b_trans',
      category: 'Transportation',
      monthlyLimit: 4000,
      spent: 0,
    },
  ],
  notifications: [
    {
      id: 'notif_welcome',
      title: 'Solo Ledger Initialized',
      message: 'Your private solo ledger is active with zero external data. Every transaction you record is strictly private to your account.',
      date: new Date().toISOString(),
      read: false,
      type: 'info',
    },
  ],
  fixedCosts: [],
};

/**
 * Dynamically resolves the active database mode (dummy vs real) and file path from environment variables.
 * Allows simply commenting out the unwanted database configuration in `.env`.
 */
export function getActiveDbConfig(): {
  mode: 'dummy' | 'real';
  fileName: string;
  filePath: string;
  dbDir: string;
} {
  const dbDir = getDataStorageDirectory();

  const rawMode = (
    process.env.DATABASE_MODE ||
    process.env.HISHAB_DB_MODE ||
    process.env.DB_MODE ||
    ''
  ).toLowerCase().trim();

  const rawName = (
    process.env.DATABASE_NAME ||
    process.env.HISHAB_DB_FILE ||
    process.env.DB_FILE ||
    ''
  ).toLowerCase().trim();

  let mode: 'dummy' | 'real' = 'real';

  if (rawMode === 'dummy' || rawName.includes('dummy')) {
    mode = 'dummy';
  } else {
    // Default fallback to real (clean slate, zero data leak)
    mode = 'real';
  }

  const fileName =
    mode === 'real'
      ? rawName && rawName.endsWith('.json') && rawName.includes('real')
        ? path.basename(rawName)
        : 'hishab_real.json'
      : rawName && rawName.endsWith('.json') && rawName.includes('dummy')
        ? path.basename(rawName)
        : 'hishab_dummy.json';

  const filePath = path.join(dbDir, fileName);

  return { mode, fileName, filePath, dbDir };
}

function getSafeUserId(userId?: string): string {
  return (userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getDb(userId?: string): DatabaseSchema {
  if (userId) {
    const userLedger = readUserLedgerData<DatabaseSchema>(userId);
    if (userLedger) {
      return JSON.parse(JSON.stringify(userLedger));
    }

    // Ledger for this specific user does not exist in local storage yet.
    // Initialize a pristine, isolated blank solo ledger strictly for this user!
    // NEVER fall back to shared dummy database or another user's data!
    try {
      const { findUserById, initializeBlankUserLedger } = require('./auth');
      const user = findUserById(userId);
      const freshLedger = initializeBlankUserLedger(
        userId,
        user?.email || `${userId}@user.hishabrakhi.com`,
        user?.profile?.name
      );
      return JSON.parse(JSON.stringify(freshLedger));
    } catch (err) {
      const fallbackLedger: DatabaseSchema = JSON.parse(JSON.stringify(realInitialData));
      fallbackLedger.user.id = userId;
      fallbackLedger.user.name = 'Solo User';
      fallbackLedger.user.email = `${userId}@user.hishabrakhi.com`;
      writeUserLedgerData(userId, fallbackLedger);
      return fallbackLedger;
    }
  }

  // Unauthenticated/guest fallback: always return a fresh deep copy of clean realInitialData
  // Never expose or mutate a shared database object!
  return JSON.parse(JSON.stringify(realInitialData));
}

/**
 * Asynchronously loads database.
 * If userId is present and PostgreSQL is configured/reachable:
 * Queries the user's dedicated table in PostgreSQL directly, so any edits made in DBeaver
 * are immediately reflected in the application!
 */
export async function getDbAsync(userId?: string): Promise<DatabaseSchema> {
  if (userId) {
    try {
      const { getUserLedgerFromPostgres } = await import('./postgres');
      const pgData = await getUserLedgerFromPostgres(userId);
      if (pgData) {
        writeUserLedgerData<DatabaseSchema>(userId, pgData);
        return JSON.parse(JSON.stringify(pgData));
      }
    } catch (err) {
      // PostgreSQL read skipped or failed, fallback to local storage
    }
  }

  return getDb(userId);
}

export function saveDb(data: DatabaseSchema, userId?: string): void {
  if (userId) {
    writeUserLedgerData<DatabaseSchema>(userId, data);

    // Persist to PostgreSQL in background
    import('./postgres')
      .then(({ saveUserLedgerToPostgres }) => {
        saveUserLedgerToPostgres(userId, data).catch(() => {});
      })
      .catch(() => {});

    return;
  }

  // If NO userId is provided, do NOT overwrite any user's ledger
  const { filePath } = getActiveDbConfig();
  safeWriteJson(filePath, data);
}

/**
 * Asynchronously saves data to both local storage and PostgreSQL.
 */
export async function saveDbAsync(data: DatabaseSchema, userId?: string): Promise<void> {
  saveDb(data, userId);
  if (userId) {
    try {
      const { saveUserLedgerToPostgres } = await import('./postgres');
      await saveUserLedgerToPostgres(userId, data);
    } catch (err) {
      // safe fallback
    }
  }
}

export function resetDb(userId?: string): DatabaseSchema {
  if (userId) {
    try {
      const { initializeBlankUserLedger, findUserById } = require('./auth');
      const user = findUserById(userId);
      return initializeBlankUserLedger(
        userId,
        user?.email || `${userId}@user.hishabrakhi.com`,
        user?.profile?.name
      );
    } catch (e) {}
  }
  return JSON.parse(JSON.stringify(realInitialData));
}

export function computeDashboardSummary(db: DatabaseSchema, userId?: string): DashboardSummary {
  // Compute strictly from database state
  const totalBalance = db.wallets.reduce((acc, w) => acc + w.balance, 0);
  const pocketWallet = db.wallets.find((w) => w.id === 'wal_pocket') || db.wallets[0];
  const availablePocketCash = pocketWallet ? pocketWallet.balance : 0;

  let totalInflow = 0;
  let totalExpense = 0;

  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const sourceMap: Record<string, number> = {};

  // Track daily inflows for week chart (0: Mon, 1: Tue, ..., 6: Sun)
  const dayInflowMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const tx of db.transactions) {
    if (tx.type === 'income') {
      totalInflow += tx.amount;
      const src = tx.sourceStream || tx.category || 'Other';
      sourceMap[src] = (sourceMap[src] || 0) + tx.amount;

      // Group into days of week
      const txDate = new Date(tx.date);
      // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
      const jsDay = txDate.getDay();
      const mappedDay = jsDay === 0 ? 6 : jsDay - 1; // convert to 0 = Mon, 6 = Sun
      dayInflowMap[mappedDay] = (dayInflowMap[mappedDay] || 0) + tx.amount;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
      const cat = tx.category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0 };
      }
      categoryMap[cat].amount += tx.amount;
      categoryMap[cat].count += 1;
    }
  }

  // All created fixed costs calculate as expenses for the active monthly cycle
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const activeFixedCosts = db.fixedCosts || [];
  for (const fc of activeFixedCosts) {
    const amt = Number(fc.amount) || 0;
    totalExpense += amt;
    const cat = fc.category || 'Bills & Utilities';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += amt;
    categoryMap[cat].count += 1;
  }

  const fixedCostTxs: Transaction[] = activeFixedCosts.map((fc) => {
    const isPaid = (fc.paidMonths || []).includes(currentMonthKey);
    const day = fc.dueDay ? String(Math.min(28, fc.dueDay)).padStart(2, '0') : '01';
    const dateStr = `${currentMonthKey}-${day}T09:00:00Z`;
    return {
      id: `fc_${fc.id}`,
      fixedCostId: fc.id,
      isFixedCost: true,
      isPaid,
      title: fc.title,
      amount: Number(fc.amount) || 0,
      type: 'expense' as const,
      category: fc.category || 'Bills & Utilities',
      date: fc.createdAt && fc.createdAt.startsWith(currentMonthKey) ? fc.createdAt : dateStr,
      status: isPaid ? 'Settled' : 'Pending',
      brandIcon: 'event_repeat',
      notes: isPaid ? 'Monthly Fixed Cost • Paid' : 'Monthly Fixed Cost • Planned (Not spent yet)',
    };
  });

  const combinedRecentTransactions = [...fixedCostTxs, ...db.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const netRemaining = Math.max(0, totalInflow - totalExpense);
  const retainedPercent = totalInflow > 0 ? Number(((netRemaining / totalInflow) * 100).toFixed(1)) : 0;
  const savingsVelocity = totalInflow > 0 ? Number((((totalInflow - totalExpense) / totalInflow) * 100).toFixed(1)) : 0;
  const dailyBurnRate = Math.round(totalExpense / 30);

  // Category breakdown list
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, info]) => ({
      category,
      amount: Math.round(info.amount),
      percentage: totalExpense > 0 ? Number(((info.amount / totalExpense) * 100).toFixed(1)) : 0,
      count: info.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Source breakdown list
  const sourceBreakdown = Object.entries(sourceMap)
    .map(([source, amount]) => ({
      source,
      amount: Math.round(amount),
      percentage: totalInflow > 0 ? Number(((amount / totalInflow) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Weekly inflow data with peak day identification
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const maxDayAmount = Math.max(...Object.values(dayInflowMap), 100);

  const weeklyInflow = days.map((day, idx) => {
    const amt = dayInflowMap[idx] || 0;
    const heightPercent = Math.min(100, Math.max(8, Math.round((amt / maxDayAmount) * 92)));
    return {
      day,
      dayLabel: dayLabels[idx],
      amount: amt,
      heightPercent,
      isPeak: amt === maxDayAmount && amt > 0,
    };
  });

  // Weekly liquidity data: dynamically computed for the past 4 weeks from user's actual transactions
  const weeklyLiquidity = [];
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  for (let i = 0; i < 4; i++) {
    const endMs = nowMs - i * oneWeekMs;
    const startMs = endMs - oneWeekMs;
    const startD = new Date(startMs);
    const endD = new Date(endMs);

    const startStr = startD.toISOString().split('T')[0];
    const endStr = endD.toISOString().split('T')[0];

    const weekTxs = db.transactions.filter((tx) => {
      const txD = tx.date ? tx.date.split('T')[0] : '';
      return txD >= startStr && txD <= endStr;
    });

    const weekInflow = weekTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const weekOutflow = weekTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const formatMonthDay = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    weeklyLiquidity.push({
      label: `Week ${4 - i}`,
      dateRange: `${formatMonthDay(startD)} – ${formatMonthDay(endD)}`,
      inflow: Math.round(weekInflow),
      outflow: Math.round(weekOutflow),
      inflowPercent: totalInflow > 0 ? Math.min(100, Math.round((weekInflow / totalInflow) * 100)) : 0,
      outflowPercent: totalExpense > 0 ? Math.min(100, Math.round((weekOutflow / totalExpense) * 100)) : 0,
    });
  }
  weeklyLiquidity.reverse();

  const { mode, fileName } = getActiveDbConfig();

  return {
    user: db.user,
    databaseMode: userId ? 'real' : mode,
    databaseFile: userId ? `users/${userId}.json` : fileName,
    totalBalance: Math.round(totalBalance),
    availablePocketCash: Math.round(availablePocketCash),
    totalInflow: Math.round(totalInflow),
    totalExpense: Math.round(totalExpense),
    netRemaining: Math.round(netRemaining),
    retainedPercent,
    debtAmount: 0,
    activeChannelsCount: Math.max(1, sourceBreakdown.length),
    savingsVelocity,
    dailyBurnRate,
    recentTransactions: combinedRecentTransactions.slice(0, 20),
    wallets: db.wallets,
    fixedCosts: db.fixedCosts || [],
    categoryBreakdown,
    sourceBreakdown,
    weeklyInflow,
    weeklyLiquidity,
  };
}

export function getDashboardSummary(userId?: string): DashboardSummary {
  const db = getDb(userId);
  return computeDashboardSummary(db, userId);
}

export async function getDashboardSummaryAsync(userId?: string): Promise<DashboardSummary> {
  const db = await getDbAsync(userId);
  return computeDashboardSummary(db, userId);
}
