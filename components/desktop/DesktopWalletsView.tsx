'use client';

import React, { useState } from 'react';
import { WalletAccount, Transaction } from '@/lib/types';

interface DesktopWalletsViewProps {
  wallets: WalletAccount[];
  transactions: Transaction[];
  currencySymbol?: string;
  onAddWallet: () => void;
  onTransfer: () => void;
}

export const DesktopWalletsView: React.FC<DesktopWalletsViewProps> = ({
  wallets,
  transactions,
  currencySymbol = '৳',
  onAddWallet,
  onTransfer,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');

  const total = wallets.reduce((acc, w) => acc + w.balance, 0);

  const cardGradients = [
    'from-[#079be8] to-[#005fb8]',
    'from-[#1e293b] to-[#0f172a]',
    'from-[#7c3aed] to-[#4c1d95]',
    'from-[#059669] to-[#064e3b]',
  ];

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
  const walletTransactions = transactions.filter((t) => t.walletId === selectedWallet?.id);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17191d]">Wallets & Cards Suite</h1>
          <p className="text-xs text-[#888]">
            Manage all checking, savings, cash, and digital payment accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTransfer}
            className="px-4 py-2 rounded-xl border border-[#e2e2e6] bg-white text-xs font-semibold text-[#17191d] hover:bg-[#fafafa]"
          >
            ⇄ Account Transfer
          </button>
          <button
            onClick={onAddWallet}
            className="px-4 py-2 rounded-xl bg-[#079be8] text-white text-xs font-bold hover:bg-[#0689cf] shadow-sm"
          >
            + Add New Account
          </button>
        </div>
      </div>

      {/* Cards Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {wallets.map((w, idx) => {
          const isSelected = w.id === selectedWalletId;
          const gradient = cardGradients[idx % cardGradients.length];

          return (
            <div
              key={w.id}
              onClick={() => setSelectedWalletId(w.id)}
              className={`rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-48 ${
                isSelected ? 'ring-4 ring-[#079be8]/40 scale-[1.01]' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
                    {w.type}
                  </span>
                  <div className="text-lg font-bold mt-0.5">{w.name}</div>
                </div>
                <div className="w-9 h-6 rounded bg-yellow-400/90 border border-yellow-300 shadow-inner flex items-center justify-center">
                  <div className="w-5 h-3.5 border border-black/20 rounded-xs"></div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-white/80">Available Balance</div>
                <div className="text-2xl font-bold tracking-tight">
                  {currencySymbol}
                  {Math.round(w.balance).toLocaleString()}
                </div>
              </div>

              <div className="flex justify-between items-end text-xs text-white/90 font-mono">
                <span>{w.accountNumber || '•••• •••• •••• 4921'}</span>
                <span className="uppercase text-[11px] font-sans font-bold">Hishab Pay</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account Deep Dive */}
      {selectedWallet && (
        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
            <div>
              <h2 className="text-lg font-bold text-[#17191d]">
                {selectedWallet.name} • Activity Statement
              </h2>
              <p className="text-xs text-[#888]">
                Account number: {selectedWallet.accountNumber} • Current Balance:{' '}
                <span className="font-bold text-[#17191d]">
                  {currencySymbol}
                  {Math.round(selectedWallet.balance).toLocaleString()}
                </span>
              </p>
            </div>
            <button
              onClick={onTransfer}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f0f8ff] text-[#079be8] hover:bg-[#e0f1fe]"
            >
              Transfer Out &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#888] uppercase text-[10px] border-b border-[#f0f0f2]">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8f9fa]">
                {walletTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[#888]">
                      No transactions recorded for this wallet yet.
                    </td>
                  </tr>
                ) : (
                  walletTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-3 font-semibold text-[#17191d]">{tx.title}</td>
                      <td className="py-2.5 px-3 text-[#666]">{tx.category}</td>
                      <td className="py-2.5 px-3 text-[#888]">
                        {new Date(tx.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {currencySymbol}
                        {Math.round(tx.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combined Balance Banner */}
      <div className="bg-[#fbfbfc] border border-[#e9e9ec] rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span className="text-xs text-[#888] uppercase font-bold tracking-wider">
            Consolidated Net Worth
          </span>
          <div className="text-2xl font-bold text-[#17191d] mt-1">
            {currencySymbol}
            {Math.round(total).toLocaleString()}
          </div>
        </div>
        <button
          onClick={onTransfer}
          className="bg-[#17191d] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-colors"
        >
          Internal Funds Rebalancing &rarr;
        </button>
      </div>
    </div>
  );
};
