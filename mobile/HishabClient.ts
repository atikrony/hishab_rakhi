/**
 * Hishab Rakhi - Official Mobile SDK Client
 * Ready to use in React Native, Expo, Flutter (via REST), or pure TypeScript mobile apps.
 */

import { DashboardSummary, Transaction, SavingsGoal, WalletAccount, ApiResponse } from '../lib/types';

export interface HishabClientConfig {
  baseUrl: string; // e.g. "https://your-hishab-app.vercel.app" or "http://10.0.2.2:3000" for Android Emulator
  apiKey?: string;
  authToken?: string;
}

export class HishabMobileClient {
  private baseUrl: string;
  private token: string | null = null;
  private apiKey: string | null = null;

  constructor(config: HishabClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.token = config.authToken || null;
    this.apiKey = config.apiKey || null;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  }

  // --- Auth ---
  async login(email?: string, password?: string) {
    const res = await this.request<{ token: string; user: any; apiKey: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      this.token = res.data.token;
    }
    return res.data;
  }

  // --- Dashboard ---
  async getDashboard(): Promise<DashboardSummary> {
    const res = await this.request<DashboardSummary>('/api/v1/dashboard');
    return res.data!;
  }

  // --- Transactions ---
  async getTransactions(params?: { q?: string; category?: string; type?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await this.request<Transaction[]>(`/api/v1/transactions?${query.toString()}`);
    return res.data || [];
  }

  async createTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const res = await this.request<Transaction>('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
    return res.data!;
  }

  async deleteTransaction(id: string) {
    return this.request(`/api/v1/transactions/${id}`, { method: 'DELETE' });
  }

  // --- Savings Goals ---
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const res = await this.request<SavingsGoal[]>('/api/v1/savings');
    return res.data || [];
  }

  async createSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    const res = await this.request<SavingsGoal>('/api/v1/savings', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return res.data!;
  }

  async depositToGoal(goalId: string, amount: number, walletId?: string): Promise<SavingsGoal> {
    const res = await this.request<SavingsGoal>(`/api/v1/savings/${goalId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount, walletId }),
    });
    return res.data!;
  }

  // --- Wallets ---
  async getWallets(): Promise<WalletAccount[]> {
    const res = await this.request<WalletAccount[]>('/api/v1/wallets');
    return res.data || [];
  }

  async transferFunds(fromWalletId: string, toWalletId: string, amount: number, note?: string) {
    return this.request('/api/v1/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify({ fromWalletId, toWalletId, amount, note }),
    });
  }

  // --- Analytics & Budgets ---
  async getAnalytics() {
    const res = await this.request<any>('/api/v1/analytics');
    return res.data;
  }

  async getBudgets() {
    const res = await this.request<any>('/api/v1/budgets');
    return res.data;
  }

  // --- Scan Receipt ---
  async scanReceipt(receiptImageBase64?: string, receiptText?: string, autoAdd: boolean = false) {
    const res = await this.request<any>('/api/v1/scan', {
      method: 'POST',
      body: JSON.stringify({ receiptImage: receiptImageBase64, receiptText, autoAdd }),
    });
    return res.data;
  }
}
