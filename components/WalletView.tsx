'use client';

import React, { useState } from 'react';
import { WalletAccount } from '@/lib/types';

interface WalletViewProps {
  wallets: WalletAccount[];
  currencySymbol?: string;
  onAddWallet: () => void;
  onTransfer: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  wallets,
  currencySymbol = '৳',
  onAddWallet,
  onTransfer,
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  const total = wallets.reduce((sum, w) => sum + w.balance, 0);

  const cardGradients = [
    'from-[#079be8] to-[#005fb8]',
    'from-[#1e293b] to-[#0f172a]',
    'from-[#7c3aed] to-[#4c1d95]',
    'from-[#059669] to-[#064e3b]',
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-[650] text-[#17191d]">My Wallets & Cards</h1>
          <p className="text-[13px] text-[#888]">Manage bank accounts, cash, and digital cards</p>
        </div>
        <button
          onClick={onTransfer}
          className="text-[13px] font-semibold text-[#079be8] bg-[#f0f8ff] px-3 py-1.5 rounded-full hover:bg-[#e0f1fe] transition-colors"
        >
          ⇄ Transfer
        </button>
      </div>

      {/* Virtual Card Preview */}
      <div className="relative">
        <div
          className={`w-full h-[190px] rounded-[22px] p-6 text-white bg-gradient-to-br ${
            cardGradients[selectedCardIndex % cardGradients.length]
          } shadow-lg shadow-black/10 flex flex-col justify-between transition-all`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
                {wallets[selectedCardIndex]?.type || 'Bank Account'}
              </span>
              <div className="text-[17px] font-semibold mt-0.5">
                {wallets[selectedCardIndex]?.name || 'Primary Wallet'}
              </div>
            </div>
            {/* Card Chip SVG */}
            <div className="w-10 h-7 rounded-md bg-yellow-400/90 border border-yellow-300 shadow-inner flex items-center justify-center">
              <div className="w-6 h-4 border border-black/20 rounded-sm"></div>
            </div>
          </div>

          <div>
            <div className="text-[12px] text-white/80">Available Balance</div>
            <div className="text-[26px] font-bold tracking-tight">
              {currencySymbol}
              {Math.round(wallets[selectedCardIndex]?.balance || 0).toLocaleString()}
            </div>
          </div>

          <div className="flex justify-between items-end text-xs text-white/90">
            <span className="tracking-widest font-mono text-[14px]">
              {wallets[selectedCardIndex]?.accountNumber || '•••• •••• •••• 4921'}
            </span>
            <span className="uppercase font-semibold tracking-wider">Hishab Pay</span>
          </div>
        </div>

        {/* Card dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {wallets.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedCardIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === selectedCardIndex ? 'w-5 bg-[#079be8]' : 'bg-[#d0d0d5]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Account Balances List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-[600] text-[#17191d]">Linked Accounts ({wallets.length})</h2>
          <button
            onClick={onAddWallet}
            className="text-[13px] text-[#079be8] font-medium hover:underline"
          >
            + Add Account
          </button>
        </div>

        <div className="space-y-2.5">
          {wallets.map((w, idx) => (
            <div
              key={w.id}
              onClick={() => setSelectedCardIndex(idx)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                idx === selectedCardIndex
                  ? 'border-[#079be8] bg-[#f0f8ff]/50'
                  : 'border-[#e9e9ec] bg-white hover:border-[#ccc]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: w.color || '#079be8' }}
                >
                  {w.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#17191d]">{w.name}</div>
                  <div className="text-[12px] text-[#888]">{w.accountNumber || 'Primary Account'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-semibold text-[#17191d]">
                  {currencySymbol}
                  {Math.round(w.balance).toLocaleString()}
                </div>
                <div className="text-[11px] text-[#888] capitalize">{w.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Assets Summary */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-[#fbfbfc] flex items-center justify-between">
        <div>
          <div className="text-[13px] text-[#888]">Combined Net Balance</div>
          <div className="text-[20px] font-bold text-[#17191d] mt-0.5">
            {currencySymbol}
            {Math.round(total).toLocaleString()}
          </div>
        </div>
        <button
          onClick={onTransfer}
          className="bg-[#17191d] text-white text-[13px] font-medium px-4 py-2 rounded-xl hover:bg-black transition-colors"
        >
          Internal Transfer
        </button>
      </div>
    </div>
  );
};

