'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';

interface ScanReceiptModalProps {
  isOpen: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onTransactionAdded: (tx: Transaction) => void;
  onToast: (msg: string) => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  currencySymbol = '$',
  onClose,
  onTransactionAdded,
  onToast,
}) => {
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

  if (!isOpen) return null;

  const simulateScan = async (presetText?: string) => {
    try {
      setScanning(true);
      setScannedResult(null);

      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptText: presetText }),
      });

      const data = await res.json();
      if (data.success) {
        setScannedResult(data.data.receipt);
      }
    } catch {
      onToast('Scanning failed, please retry');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!scannedResult) return;
    try {
      setScanning(true);
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scannedResult.merchant,
          amount: scannedResult.amount,
          type: 'expense',
          category: scannedResult.category,
          notes: scannedResult.notes,
          brandIcon: scannedResult.brandIcon,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onTransactionAdded(json.data);
        onToast(`Added: ${scannedResult.merchant} (${currencySymbol}${scannedResult.amount})`);
        onClose();
      }
    } catch {
      onToast('Failed to add transaction');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f2]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white">
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3M8 12h8" />
              </svg>
            </span>
            <h2 className="text-[19px] font-[650] text-[#17191d]">Smart Receipt Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Scanner Viewfinder Box */}
          <div className="border-2 border-dashed border-[#d1d5db] rounded-2xl p-6 text-center bg-[#fafafa] relative overflow-hidden">
            {scanning && (
              <div className="absolute inset-0 bg-blue-50/70 backdrop-blur-[1px] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#079be8] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-[#079be8] mt-3">
                  AI OCR Analyzing Receipt...
                </span>
              </div>
            )}

            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#079be8] flex items-center justify-center mb-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-[1.8]">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#17191d]">Scan paper or digital receipt</p>
            <p className="text-xs text-[#888] mt-1">Camera OCR extracts merchant, amount, & date</p>

            <button
              onClick={() => simulateScan()}
              className="mt-3 px-4 py-2 bg-[#17191d] text-white text-xs font-medium rounded-xl hover:bg-black transition-colors"
            >
              Simulate Live Camera Scan
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs font-semibold text-[#888] block mb-2">Or test sample receipts:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => simulateScan('Starbucks Coffee')}
                className="p-2 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left font-medium"
              >
                ☕ Starbucks ($4.85)
              </button>
              <button
                onClick={() => simulateScan('Target Supercenter')}
                className="p-2 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left font-medium"
              >
                🛒 Target Market ($42.60)
              </button>
              <button
                onClick={() => simulateScan('Uber Ride')}
                className="p-2 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left font-medium"
              >
                🚗 Uber Ride ($18.25)
              </button>
              <button
                onClick={() => simulateScan('Pharmacy')}
                className="p-2 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left font-medium"
              >
                💊 Pharmacy ($22.40)
              </button>
            </div>
          </div>

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 animate-slide-up">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Scan Verified ({(scannedResult.confidence * 100).toFixed(0)}% match)
                  </span>
                  <div className="text-base font-bold text-[#17191d] mt-1">
                    {scannedResult.merchant}
                  </div>
                  <div className="text-xs text-[#666]">{scannedResult.notes}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#fa4563]">
                    -{currencySymbol}
                    {scannedResult.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#888]">{scannedResult.category}</div>
                </div>
              </div>

              <button
                onClick={handleConfirmAdd}
                disabled={scanning}
                className="w-full mt-2 py-2.5 bg-[#219b35] text-white font-semibold text-xs rounded-xl hover:bg-[#1a802b] transition-colors"
              >
                ✓ Confirm & Add to Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

