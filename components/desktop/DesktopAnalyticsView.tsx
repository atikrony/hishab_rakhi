'use client';

import React, { useEffect, useState } from 'react';
import { Transaction } from '@/lib/types';

interface DesktopAnalyticsViewProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

export const DesktopAnalyticsView: React.FC<DesktopAnalyticsViewProps> = ({
  transactions,
  currencySymbol = '৳',
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [transactions]);

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-[#888] animate-pulse">
        Generating financial analytics intelligence...
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Food: '#fa4563',
    Subscription: '#079be8',
    Salary: '#219b35',
    Freelance: '#10b981',
    Bills: '#f59e0b',
    Shopping: '#8b5cf6',
    Entertainment: '#ec4899',
    Transport: '#6366f1',
    Health: '#14b8a6',
    Other: '#94a3b8',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#17191d]">Analytics & Financial Intelligence</h1>
        <p className="text-xs text-[#888]">
          Comprehensive cash flow trends, category distribution, and savings velocity
        </p>
      </div>

      {/* Highlights KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-xs">
          <span className="text-xs text-[#888] uppercase font-semibold">Total Net Savings</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            +{currencySymbol}
            {Math.round(data.netSavings).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#888] mt-2">Calculated from all active income</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-xs">
          <span className="text-xs text-[#888] uppercase font-semibold">Savings Rate</span>
          <div className="text-2xl font-bold text-[#079be8] mt-1">{data.savingsRate}%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Optimal range (&gt;20%)</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-xs">
          <span className="text-xs text-[#888] uppercase font-semibold">Top Expense Category</span>
          <div className="text-xl font-bold text-[#17191d] mt-1 truncate">
            {data.topCategory ? data.topCategory.category : 'N/A'}
          </div>
          <div className="text-[11px] text-[#fa4563] font-semibold mt-2">
            {data.topCategory
              ? `${currencySymbol}${data.topCategory.amount} (${data.topCategory.percentage}%)`
              : 'None'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-xs">
          <span className="text-xs text-[#888] uppercase font-semibold">Total Verified Entries</span>
          <div className="text-2xl font-bold text-[#17191d] mt-1">{data.transactionCount}</div>
          <div className="text-[11px] text-[#888] mt-2">Logged across all accounts</div>
        </div>
      </div>

      {/* Grid: Cashflow Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cashflow Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e9e9ec] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17191d]">6-Month Inflow vs Outflow Trend</h2>
              <p className="text-xs text-[#888]">Monthly cash flow consistency analysis</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#079be8]"></span> Inflow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#fa4563]"></span> Outflow
              </span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 pt-10 pb-4 items-end h-[220px] border-b border-[#f0f0f2]">
            {data.monthlyOverview?.map((m: any, i: number) => {
              const maxVal = 8000;
              const incHeight = Math.min(100, Math.round((m.income / maxVal) * 100));
              const expHeight = Math.min(100, Math.round((m.expense / maxVal) * 100));

              return (
                <div key={i} className="flex flex-col items-center h-full justify-end group">
                  <div className="flex items-end gap-1.5 w-full justify-center h-full">
                    <div
                      style={{ height: `${incHeight}%` }}
                      className="w-4 rounded-t-md bg-[#079be8] group-hover:opacity-85 transition-all shadow-xs"
                      title={`Income: ৳${m.income}`}
                    />
                    <div
                      style={{ height: `${expHeight}%` }}
                      className="w-4 rounded-t-md bg-[#fa4563] group-hover:opacity-85 transition-all shadow-xs"
                      title={`Expense: ৳${m.expense}`}
                    />
                  </div>
                  <span className="text-xs text-[#888] font-medium mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-[#888] pt-1">
            <span>Average Net Margin: +৳2,100 / month</span>
            <span className="text-emerald-600 font-semibold">Positive Cash Runway</span>
          </div>
        </div>

        {/* Category Breakdown Progress Bars (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e9e9ec] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#17191d]">Spending by Category</h2>
            <p className="text-xs text-[#888]">Breakdown of where your capital goes</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {data.categoryBreakdown?.length === 0 ? (
              <div className="text-center text-xs text-[#888] py-8">No expenses logged yet.</div>
            ) : (
              data.categoryBreakdown?.map((cat: any) => {
                const color = categoryColors[cat.category] || '#94a3b8';

                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[#17191d] font-semibold">{cat.category}</span>
                      </span>
                      <span className="text-[#888]">
                        {currencySymbol}
                        {cat.amount.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#f0f0f3] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
