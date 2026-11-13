'use client';

import React, { useState } from 'react';

interface AddWalletModalProps {
  isOpen: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string) => void;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  isOpen,
  currencySymbol = '৳',
  onClose,
  onSuccess,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit' | 'digital'>('bank');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#079be8');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/v1/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          balance: parseFloat(balance) || 0,
          accountNumber: accountNumber ? `•••• ${accountNumber.slice(-4)}` : undefined,
          color,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onToast(`Added wallet: ${name}`);
        onSuccess();
        onClose();
      } else {
        onToast(data.error || 'Failed to add wallet');
      }
    } catch {
      onToast('Error adding wallet');
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#079be8', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#17191d'];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">Add Account / Card</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Standard Chartered Bank / Revolut"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm bg-white"
            >
              <option value="bank">Bank Checking / Savings</option>
              <option value="cash">Cash Wallet</option>
              <option value="credit">Credit Card</option>
              <option value="digital">Digital E-Wallet (bKash/PayPal)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Initial Balance ({currencySymbol})</label>
            <input
              type="number"
              step="1"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Account / Card Last 4 Digits</label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 5821"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase block mb-1">Theme Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    color === c ? 'border-black scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-2xl bg-[#079be8] text-white font-semibold text-sm hover:bg-[#0689cf] transition-colors"
            >
              {loading ? 'Adding...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

