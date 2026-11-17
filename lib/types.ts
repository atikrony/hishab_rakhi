export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Food'
  | 'Food & Dining'
  | 'Tech & Gadgets'
  | 'Bills & Utilities'
  | 'Transportation'
  | 'Health & Meds'
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Gift'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Subscription'
  | 'Transport'
  | 'Health'
  | 'Other'
  | string;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string e.g. "2024-11-10T14:24:00Z"
  walletId?: string;
  notes?: string;
  paymentMethod?: string;
  sourceStream?: string;
  channel?: string;
  status?: string;
  brandIcon?: string;
  receiptUrl?: string;
  isFixedCost?: boolean;
  isPaid?: boolean;
  fixedCostId?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  targetDate?: string;
  note?: string;
  color?: string;
}

export interface WalletAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'digital';
  balance: number;
  accountNumber?: string;
  color?: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'alert';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  currency: string;
  currencySymbol: string;
  occupation?: string;
  monthlyIncome?: number;
  salaryDate?: string;
  lastExpense?: number;
}

export interface FixedCost {
  id: string;
  title: string;
  amount: number;
  category: string;
  dueDay?: number;
  paidMonths?: string[];
  notes?: string;
  createdAt?: string;
}

export interface DashboardSummary {
  user: UserProfile;
  databaseMode?: 'dummy' | 'real';
  databaseFile?: string;
  totalBalance: number;
  availablePocketCash: number;
  totalInflow: number;
  totalExpense: number;
  netRemaining: number;
  retainedPercent: number;
  debtAmount: number;
  activeChannelsCount: number;
  savingsVelocity: number;
  dailyBurnRate: number;
  recentTransactions: Transaction[];
  wallets: WalletAccount[];
  fixedCosts?: FixedCost[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
  sourceBreakdown: {
    source: string;
    amount: number;
    percentage: number;
  }[];
  weeklyInflow: {
    day: string;
    dayLabel: string;
    amount: number;
    heightPercent: number;
    isPeak?: boolean;
  }[];
  weeklyLiquidity: {
    label: string;
    dateRange: string;
    inflow: number;
    outflow: number;
    inflowPercent: number;
    outflowPercent: number;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, any>;
}
