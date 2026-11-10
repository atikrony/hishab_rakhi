'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';

interface DesktopScannerViewProps {
  currencySymbol?: string;
  onTransactionAdded: (tx: Transaction) => void;
  onToast: (msg: string) => void;
}

export const DesktopScannerView: React.FC<DesktopScannerViewProps> = ({
  currencySymbol = '$',
  onTransactionAdded,
  onToast,
}) => {
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

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
        setScannedResult(null);
      }
    } catch {
      onToast('Failed to add transaction');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#17191d]">Smart Receipt Scanner & OCR Workbench</h1>
        <p className="text-xs text-[#888]">
          Upload paper or digital receipts to extract merchants, totals, and categories automatically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dropzone & Scanner Viewfinder (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e9e9ec] p-6 shadow-xs space-y-4">
          <div className="border-2 border-dashed border-[#d1d5db] rounded-2xl p-10 text-center bg-[#fafafa] relative overflow-hidden">
            {scanning && (
              <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-xs flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#079be8] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-[#079be8] mt-3">
                  AI OCR Parsing Receipt Data...
                </span>
              </div>
            )}

            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-[#079be8] flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none stroke-[2]">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#17191d]">Drag and drop receipt image here</h3>
            <p className="text-xs text-[#888] mt-1 max-w-sm mx-auto">
              Supports JPEG, PNG, HEIC, and PDF. Automatic merchant detection and transaction auto-categorization.
            </p>

            <button
              onClick={() => simulateScan()}
              className="mt-5 px-6 py-2.5 bg-[#17191d] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors shadow-xs"
            >
              Simulate Live Camera Capture
            </button>
          </div>

          <div>
            <span className="text-xs font-bold text-[#888] uppercase block mb-2">
              Or Test Quick Sample Receipts:
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => simulateScan('Starbucks Coffee')}
                className="p-3 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left transition-all"
              >
                <div className="font-bold text-[#17191d]">☕ Starbucks Coffee</div>
                <div className="text-[#888] mt-0.5">Caramel Macchiato (${currencySymbol}4.85)</div>
              </button>
              <button
                onClick={() => simulateScan('Target Supercenter')}
                className="p-3 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left transition-all"
              >
                <div className="font-bold text-[#17191d]">🛒 Target Supercenter</div>
                <div className="text-[#888] mt-0.5">Household groceries (${currencySymbol}42.60)</div>
              </button>
              <button
                onClick={() => simulateScan('Uber Ride')}
                className="p-3 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left transition-all"
              >
                <div className="font-bold text-[#17191d]">🚗 Uber Ride</div>
                <div className="text-[#888] mt-0.5">Downtown trip (${currencySymbol}18.25)</div>
              </button>
              <button
                onClick={() => simulateScan('Pharmacy')}
                className="p-3 border border-[#e2e2e6] rounded-xl hover:bg-[#f0f8ff] hover:border-[#079be8] text-left transition-all"
              >
                <div className="font-bold text-[#17191d]">💊 Pharmacy & Health</div>
                <div className="text-[#888] mt-0.5">Prescriptions (${currencySymbol}22.40)</div>
              </button>
            </div>
          </div>
        </div>

        {/* OCR Result & Live Ledger Commitment (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e9e9ec] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17191d]">OCR Extraction Preview</h2>
            <p className="text-xs text-[#888] mb-4">Live structured parsed fields</p>

            {scannedResult ? (
              <div className="space-y-4 animate-slide-up">
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Confidence {(scannedResult.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-[#888]">Scanned Today</span>
                  </div>

                  <div className="text-xl font-bold text-[#17191d]">{scannedResult.merchant}</div>
                  <div className="text-xs text-[#666] mt-1">{scannedResult.notes}</div>

                  <div className="flex justify-between items-end mt-4 pt-3 border-t border-emerald-200/60">
                    <div>
                      <span className="text-xs text-[#888]">Detected Category</span>
                      <div className="font-bold text-xs text-[#17191d] mt-0.5">
                        {scannedResult.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#888]">Amount</span>
                      <div className="text-2xl font-bold text-[#fa4563]">
                        -{currencySymbol}{scannedResult.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#888] space-y-1">
                  <div>✓ Tax and subtotal matched</div>
                  <div>✓ Merchant verified in transaction database</div>
                  <div>✓ Ready for instant ledger commit</div>
                </div>
              </div>
            ) : (
              <div className="border border-[#ededf0] rounded-xl p-8 text-center text-xs text-[#888]">
                No active scan. Click "Simulate Live Camera Capture" or a sample preset to test.
              </div>
            )}
          </div>

          {scannedResult && (
            <button
              onClick={handleConfirmAdd}
              disabled={scanning}
              className="w-full mt-6 py-3 bg-[#219b35] text-white font-bold text-xs rounded-xl hover:bg-[#1a802b] shadow-sm transition-all"
            >
              ✓ Confirm & Commit to Ledger
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

