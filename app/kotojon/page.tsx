'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface UserItem {
  id: string;
  email: string;
  createdAt: string;
  onboardingCompleted: boolean;
  name: string;
  occupation: string;
  monthlyIncome: number;
  salaryDate?: string;
}

interface DailyRecord {
  date: string;
  visits: number;
  uniques: number;
}

interface RecentVisit {
  id: string;
  path: string;
  timestamp: string;
  userAgent?: string;
}

interface KotojonStats {
  totalUsers: number;
  activeUsers: number;
  onboardingPending: number;
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  totalTransactions: number;
  totalFixedCosts: number;
  totalInflowVolume: number;
  totalExpenseVolume: number;
  dailyHistory: DailyRecord[];
  recentVisits: RecentVisit[];
  userRoster: UserItem[];
  meta: {
    generatedAt: string;
    environment: string;
  };
}

export default function KotojonPage() {
  const [stats, setStats] = useState<KotojonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/v1/kotojon', { cache: 'no-store' });
      const json = await res.json();

      if (json.success && json.data) {
        setStats(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch stats');
      }
    } catch {
      setError('Network error loading data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Filter user roster
  const filteredUsers = (stats?.userRoster || []).filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.occupation.toLowerCase().includes(q)
    );
  });

  const maxVisitsInHistory = Math.max(
    ...(stats?.dailyHistory?.map((h) => h.visits) || [1]),
    1
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased p-4 sm:p-6 lg:p-10 flex flex-col gap-8">
      {/* Top Banner / Navigation */}
      <header className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Hidden Dashboard
            </span>
            <span className="text-xs text-outline font-medium">Hishab Rakhi Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
            <span>কতজন</span>
            <span className="text-sm font-normal text-outline">/kotojon</span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Live telemetry on user adoption, active subscribers, and anonymous visitor traffic across Hishab Rakhi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={loading || refreshing}
            className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-2 transition-all border border-surface-container active:scale-95 disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                refreshing ? 'animate-spin text-primary' : 'text-on-surface-variant'
              }`}
            >
              refresh
            </span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/spend"
            className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary-container transition-all shadow-sm active:scale-95"
          >
            <span>Open App</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        {error && (
          <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* 6 Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                Total Registered Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-on-surface tracking-tight">
                {loading ? '...' : (stats?.totalUsers || 0).toLocaleString()}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-primary font-medium">
                <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                <span>
                  {stats?.activeUsers || 0} active ({stats?.onboardingPending || 0} pending setup)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Visitors */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                Total Page Visits
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-on-surface tracking-tight">
                {loading ? '...' : (stats?.totalVisits || 0).toLocaleString()}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+{stats?.todayVisits || 0} visits recorded today</span>
              </div>
            </div>
          </div>

          {/* Card 3: Unique Visitors */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                Unique Visitors
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">person_search</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-on-surface tracking-tight">
                {loading ? '...' : (stats?.uniqueVisitors || 0).toLocaleString()}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                <span>Distinct devices &amp; browsers</span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Transactions */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                Recorded Transactions
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-on-surface tracking-tight">
                {loading ? '...' : (stats?.totalTransactions || 0).toLocaleString()}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                <span>Across all active user ledgers</span>
              </div>
            </div>
          </div>

          {/* Card 5: Fixed Costs */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                Active Fixed Costs
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">event_repeat</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-on-surface tracking-tight">
                {loading ? '...' : (stats?.totalFixedCosts || 0).toLocaleString()}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                <span>Monthly recurring commitments</span>
              </div>
            </div>
          </div>

          {/* Card 6: Health / Environment */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">
                System Health
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                Operational
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-outline font-medium">
                <span className="material-symbols-outlined text-[14px]">dns</span>
                <span>Next.js 15 App Router • Node.js</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Visitor Traffic Breakdown (If available) */}
        {stats?.dailyHistory && stats.dailyHistory.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 border border-surface-container shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">Daily Visitor Activity</h3>
                <p className="text-xs text-on-surface-variant">
                  Recent traffic trend over the last {stats.dailyHistory.length} days
                </p>
              </div>
              <span className="text-xs font-semibold text-outline">
                Peak: {maxVisitsInHistory} visits/day
              </span>
            </div>

            <div className="flex items-end gap-2 pt-6 pb-2 h-44 overflow-x-auto border-b border-surface-container">
              {stats.dailyHistory.map((item) => {
                const heightPct = Math.max(12, Math.round((item.visits / maxVisitsInHistory) * 100));
                return (
                  <div
                    key={item.date}
                    className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group"
                  >
                    <div className="text-[10px] text-outline opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {item.visits}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[28px] bg-primary/70 hover:bg-primary rounded-t-md transition-all shadow-xs"
                      title={`${item.date}: ${item.visits} visits (${item.uniques} unique)`}
                    />
                    <span className="text-[10px] text-on-surface-variant font-medium truncate w-full text-center">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Registered Users Roster Table */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 border border-surface-container shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface">Registered User Roster</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  {stats?.totalUsers || 0}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Individuals currently registered to use Hishab Rakhi
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or email..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface outline-none border border-surface-container focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-surface-container rounded-xl">
            <table className="w-full text-left text-xs text-on-surface border-collapse">
              <thead>
                <tr className="bg-surface-container-low/60 border-b border-surface-container text-on-surface-variant uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Registered At</th>
                  <th className="py-3 px-3">Onboarding</th>
                  <th className="py-3 px-3">Occupation</th>
                  <th className="py-3 px-4 text-right">Declared Monthly Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-outline">
                      <span className="material-symbols-outlined text-[32px] block mb-1 text-outline">
                        person_off
                      </span>
                      <span>No users found. New registrations will automatically appear here.</span>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const initials = (user.name || user.email || 'U')
                      .slice(0, 2)
                      .toUpperCase();
                    const formattedDate = new Date(user.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={user.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-on-surface truncate">
                                {user.name !== 'Not set' ? user.name : user.email.split('@')[0]}
                              </span>
                              <span className="text-[11px] text-outline truncate">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">{formattedDate}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.onboardingCompleted
                                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.onboardingCompleted ? 'bg-secondary' : 'bg-amber-500'
                              }`}
                            />
                            {user.onboardingCompleted ? 'Completed' : 'Pending Setup'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">{user.occupation}</td>
                        <td className="py-3 px-4 text-right font-bold text-on-surface">
                          {user.monthlyIncome > 0 ? `৳${user.monthlyIncome.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-6 border-t border-surface-container text-center text-xs text-outline">
        Hishab Rakhi Private Telemetry • Route: <code>/kotojon</code> • Real-time visitor and user tracker
      </footer>
    </div>
  );
}

