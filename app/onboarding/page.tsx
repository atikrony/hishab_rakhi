'use client';

import React, { useState, useEffect } from 'react';

export default function OnboardingPage() {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('50000');
  const [salaryDate, setSalaryDate] = useState(() => {
    // Default to the 1st of current month
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}-01`;
  });
  const [lastExpense, setLastExpense] = useState('2500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify authentication on mount; if unauthorized, navigate to login
  useEffect(() => {
    fetch('/api/v1/auth/profile')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/auth/login';
        }
      })
      .catch(() => {});
  }, []);

  const parsedIncome = Math.max(0, parseInt(monthlyIncome || '0', 10));
  const parsedExpense = Math.max(0, parseInt(lastExpense || '0', 10));
  const netEstimatedPocket = Math.max(0, parsedIncome - parsedExpense);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!occupation.trim()) {
      setError('Please provide your occupation or profession.');
      return;
    }

    if (parsedIncome <= 0) {
      setError('Please enter a valid monthly salary/income (greater than 0).');
      return;
    }

    if (salaryDate > today) {
      setError('Future salary dates are not permitted. Please select today or a past date.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          occupation: occupation.trim(),
          monthlyIncome: parsedIncome,
          salaryDate,
          lastExpense: parsedExpense,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to complete setup. Please check your inputs.');
        return;
      }

      // Route directly to primary Spend page
      window.location.href = '/spend';
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-center items-center px-4 py-8 sm:py-12 select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200/80 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg mb-3">
            <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 rounded-full">
            Solo Profile Setup • Step 2 of 2
          </span>
          <h1 className="text-2xl sm:text-3xl text-gray-900 font-extrabold mt-3 tracking-tight">
            Financial Ledger Setup
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Everything submitted here initializes your solo dashboard with your income and expense.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Field 1: Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1">
              <span>Full Name</span>
              <span className="text-emerald-700 font-bold">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-gray-400 material-symbols-outlined text-[20px]">
                badge
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Atiqur Rahman"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold outline-none border border-gray-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
              />
            </div>
          </div>

          {/* Field 2: Occupation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1">
              <span>Occupation / Profession</span>
              <span className="text-emerald-700 font-bold">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-gray-400 material-symbols-outlined text-[20px]">
                work
              </span>
              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer, Doctor, Business"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold outline-none border border-gray-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
              />
            </div>
          </div>

          {/* Field 3: Monthly salary/income */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1">
                <span>Monthly Salary / Income (৳)</span>
                <span className="text-emerald-700 font-bold">*</span>
              </label>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                Added to Inflow
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-bold text-lg text-emerald-700 select-none">
                ৳
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 text-gray-900 text-base font-bold outline-none border border-gray-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all tabular-nums"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {['30000', '50000', '80000', '120000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyIncome(preset)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold border border-gray-200 transition-colors"
                >
                  ৳{parseInt(preset, 10).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Field 4: Salary Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1">
              <span>Salary Date</span>
              <span className="text-emerald-700 font-bold">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-gray-400 material-symbols-outlined text-[20px]">
                calendar_today
              </span>
              <input
                type="date"
                required
                max={today}
                value={salaryDate}
                onChange={(e) => setSalaryDate(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 text-gray-900 text-sm font-medium outline-none border border-gray-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
              />
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5">
              The settlement date for this month&apos;s salary (today or a past date).
            </span>
          </div>

          {/* Field 5: Last expense */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1">
                <span>Last Expense (৳)</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              <span className="text-[11px] text-rose-800 font-bold bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md">
                Added to Expenses
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-bold text-lg text-rose-600 select-none">
                ৳
              </span>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={lastExpense}
                onChange={(e) => setLastExpense(e.target.value)}
                placeholder="0"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 text-gray-900 text-base font-bold outline-none border border-gray-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all tabular-nums"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {['500', '1500', '2500', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLastExpense(preset)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold border border-gray-200 transition-colors"
                >
                  ৳{parseInt(preset, 10).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Live Ledger Preview Pill */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col gap-2 mt-1">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              Starting Ledger Balance Preview
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <span className="text-[11px] text-gray-500 block">Total Inflow</span>
                <span className="text-xs font-extrabold text-emerald-700">
                  +৳{parsedIncome.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <span className="text-[11px] text-gray-500 block">Total Outflow</span>
                <span className="text-xs font-extrabold text-rose-600">
                  -৳{parsedExpense.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-sm">
                <span className="text-[11px] text-gray-500 block">Pocket Cash</span>
                <span className="text-xs font-extrabold text-gray-900">
                  ৳{netEstimatedPocket.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Initializing Solo Dashboard...</span>
              </>
            ) : (
              <>
                <span>Launch Solo Dashboard</span>
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Guarantee */}
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mt-6">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        <span>Private Solo Ledger • Isolated account with whole taka precision</span>
      </div>
    </div>
  );
}
