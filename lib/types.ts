export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Food'
  | 'Subscription'
  | 'Salary'
  | 'Freelance'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Transport'
  | 'Health'
  | 'Investment'
  | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO string e.g. "2026-06-03T12:21:00Z"
  walletId?: string;
  notes?: string;
  brandIcon?: 'youtube' | 'apple' | 'food' | 'freelance' | 'coffee' | 'shopping' | 'bills' | 'default';
  receiptUrl?: string;
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
  category: TransactionCategory;
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
  currency: string;
  currencySymbol: string;
}

export interface DashboardSummary {
  user: UserProfile;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeTrend: number;
  expenseTrend: number;
  savingsGoals: SavingsGoal[];
  recentTransactions: Transaction[];
  wallets: WalletAccount[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, any>;
}

