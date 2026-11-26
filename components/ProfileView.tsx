'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserProfile, Transaction } from '@/lib/types';

interface ProfileViewProps {
  user: UserProfile;
  transactions: Transaction[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetData: () => void;
  onToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  transactions,
  onUpdateProfile,
  onResetData,
  onToast,
}) => {
  const [name, setName] = useState(user.name);
  const [currencySymbol, setCurrencySymbol] = useState(user.currencySymbol || '৳');
  const [apiKey] = useState('key_live_hishab_8921f00a391e');

  const currencies = [
    { label: 'BDT (৳)', symbol: '৳' },
    { label: 'USD ($)', symbol: '$' },
    { label: 'EUR (€)', symbol: '€' },
    { label: 'GBP (£)', symbol: '£' },
    { label: 'INR (₹)', symbol: '₹' },
  ];

  const handleCurrencyChange = (sym: string) => {
    setCurrencySymbol(sym);
    onUpdateProfile({ currencySymbol: sym });
    onToast(`Currency updated to ${sym}`);
  };

  const handleNameSave = () => {
    onUpdateProfile({ name });
    onToast('Name updated successfully');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Amount', 'Type', 'Category', 'Date', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      t.date,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `behishebi_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('CSV transactions exported!');
  };

  const handleExportJSON = async () => {
    try {
      const res = await fetch('/api/v1/data');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `behishebi_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onToast('JSON database backup downloaded!');
    } catch {
      onToast('Failed to export data');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onToast(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      <div>
        <h1 className="text-[22px] font-[650] text-[#17191d]">Settings & Profile</h1>
        <p className="text-[13px] text-[#888]">Account preferences, mobile API, and data sync</p>
      </div>

      {/* Profile Card */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm flex items-center gap-4">
        <img
          className="w-16 h-16 rounded-full object-cover border-2 border-[#079be8]/20"
          src={user.avatar}
          alt={user.name}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSave}
              className="font-bold text-[17px] text-[#17191d] border-b border-transparent focus:border-[#079be8] outline-none"
            />
          </div>
          <div className="text-[13px] text-[#888]">{user.email || 'naufal@example.com'}</div>
          <div className="text-[11px] text-[#079be8] font-medium mt-1">Verified User • Free Plan</div>
        </div>
      </div>

      {/* Currency Switcher */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#17191d] mb-1">Display Currency</h2>
        <p className="text-[12px] text-[#888] mb-3">Choose the default currency symbol for your wallet</p>
        <div className="grid grid-cols-5 gap-2">
          {currencies.map((c) => (
            <button
              key={c.symbol}
              onClick={() => handleCurrencyChange(c.symbol)}
              className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${
                currencySymbol === c.symbol
                  ? 'border-[#079be8] bg-[#f0f8ff] text-[#079be8]'
                  : 'border-[#e2e2e6] text-[#444] hover:border-[#bbb]'
              }`}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile App API Section */}
      <div className="border border-[#079be8]/30 rounded-2xl p-4 bg-gradient-to-br from-[#f0f8ff] to-white shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-[15px] font-bold text-[#17191d]">Mobile App API (Ready)</h2>
          </div>
          <Link
            href="/api-docs"
            className="text-xs font-semibold text-[#079be8] hover:underline"
          >
            Open API Playground &rarr;
          </Link>
        </div>
        <p className="text-[12px] text-[#666] mb-3">
          Dedicated REST endpoints under <code className="bg-white/80 px-1 py-0.5 rounded text-[11px]">/api/v1/*</code> for your React Native, Flutter, iOS, and Android mobile apps.
        </p>

        <div className="space-y-2 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-[#e2e2e6] flex items-center justify-between">
            <div>
              <span className="text-[#888] block text-[10px] uppercase font-bold">Base API URL</span>
              <span className="font-mono text-[12px] text-[#222]">/api/v1/dashboard</span>
            </div>
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/api/v1`, 'API Base URL')}
              className="text-[#079be8] font-semibold hover:underline"
            >
              Copy URL
            </button>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#e2e2e6] flex items-center justify-between">
            <div>
              <span className="text-[#888] block text-[10px] uppercase font-bold">Mobile API Key</span>
              <span className="font-mono text-[12px] text-[#222]">{apiKey}</span>
            </div>
            <button
              onClick={() => copyToClipboard(apiKey, 'API Key')}
              className="text-[#079be8] font-semibold hover:underline"
            >
              Copy Key
            </button>
          </div>
        </div>
      </div>

      {/* Data Management & Export */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm space-y-3">
        <h2 className="text-[15px] font-semibold text-[#17191d]">Data Backup & Export</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-3 rounded-xl border border-[#e2e2e6] text-xs font-semibold text-[#333] hover:bg-[#fafafa] flex items-center justify-center gap-1.5"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="py-2.5 px-3 rounded-xl border border-[#e2e2e6] text-xs font-semibold text-[#333] hover:bg-[#fafafa] flex items-center justify-center gap-1.5"
          >
            💾 Backup JSON
          </button>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset database back to the original prototype demo transactions?')) {
              onResetData();
            }
          }}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#fa4563] bg-red-50 hover:bg-red-100 transition-colors"
        >
          ↺ Reset to Prototype Initial State
        </button>
      </div>

      {/* Publishing & PWA */}
      <div className="text-center pt-2 text-xs text-[#888] space-y-1">
        <div>Behishebi v1.0.0 • Production Ready</div>
        <div className="text-[#aaa]">Supports Web, Mobile PWA, and Native Mobile APIs</div>
      </div>
    </div>
  );
};

