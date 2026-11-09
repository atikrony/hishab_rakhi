'use client';

import React, { useState } from 'react';
import { WalletAccount } from '@/lib/types';

interface TransferFundsModalProps {
  isOpen: boolean;
  wallets: WalletAccount[];
  currencySymbol?: string;
  onClose: () => void;
  onTransferSuccess: () => void;
  onToast: (msg: string) => void;
}

export const TransferFundsModal: React.FC<TransferFundsModalProps> = ({
  isOpen,
  wallets,
  currencySymbol = '$',
  onClose,
  onTransferSuccess,
  onToast,
}) => {
  const [fromWallet, setFromWallet] = useState(wallets[0]?.id || '');
  const [toWallet, setToWallet] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (fromWallet === toWallet) {
      onToast('Source and destination wallets must be different');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/v1/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletId: fromWallet,
          toWalletId: toWallet,
          amount: numAmount,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onToast(`Transferred ${currencySymbol}${numAmount} successfully!`);
        onTransferSuccess();
        onClose();
      } else {
        onToast(data.error || 'Transfer failed');
      }
    } catch {
      onToast('Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">Transfer Money</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">From Account</label>
            <select
              value={fromWallet}
              onChange={(e) => setFromWallet(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm bg-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Balance: {currencySymbol}{w.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">To Account</label>
            <select
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm bg-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Balance: {currencySymbol}{w.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Transfer Amount ({currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-lg font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Move savings to cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-2xl bg-[#079be8] text-white font-semibold text-sm hover:bg-[#0689cf] transition-colors"
            >
              {loading ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
