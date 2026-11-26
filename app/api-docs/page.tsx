'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  sampleBody?: any;
}

const endpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/dashboard',
    title: 'Mobile Dashboard Summary',
    description: 'Fetch complete user balance, income, expense, active savings goals, and recent transactions in 1 request.',
  },
  {
    method: 'GET',
    path: '/api/v1/transactions',
    title: 'List Transactions',
    description: 'Query transactions with search, category filtering, and pagination.',
  },
  {
    method: 'POST',
    path: '/api/v1/transactions',
    title: 'Create Transaction',
    description: 'Add a new expense or income transaction and automatically update wallet balance.',
    sampleBody: {
      title: 'Mobile App Coffee Order',
      amount: 4.5,
      type: 'expense',
      category: 'Food',
      notes: 'Iced caramel macchiato',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/savings',
    title: 'List Savings Goals',
    description: 'Retrieve all current savings goals with milestone progress percentages.',
  },
  {
    method: 'POST',
    path: '/api/v1/savings',
    title: 'Create Savings Goal',
    description: 'Set up a new target savings goal with target amount and date.',
    sampleBody: {
      title: 'New M4 MacBook Pro',
      targetAmount: 2200,
      currentAmount: 400,
      category: 'Electronics',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/savings/goal_pc_gaming/deposit',
    title: 'Deposit to Savings Goal',
    description: 'Add funds into a goal and deduct from your checking account.',
    sampleBody: {
      amount: 150,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/wallets',
    title: 'List Linked Accounts & Cards',
    description: 'Get all checking accounts, cash wallets, credit cards, and digital wallets.',
  },
  {
    method: 'POST',
    path: '/api/v1/wallets/transfer',
    title: 'Transfer Funds Between Accounts',
    description: 'Transfer funds from one wallet account to another.',
    sampleBody: {
      fromWalletId: 'wal_main',
      toWalletId: 'wal_cash',
      amount: 100,
      note: 'ATM cash withdrawal',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/analytics',
    title: 'Financial Analytics & Trends',
    description: 'Get spending breakdown by category and monthly cashflow comparisons.',
  },
  {
    method: 'POST',
    path: '/api/v1/scan',
    title: 'Smart Receipt Scanner OCR',
    description: 'Parse physical or digital receipts and extract merchant, total, and category.',
    sampleBody: {
      receiptText: 'Starbucks Coffee 2x Iced Latte Total ৳9.50',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    title: 'Mobile Client Authentication',
    description: 'Authenticate mobile user session and receive Bearer token and API key.',
    sampleBody: {
      email: 'naufal@example.com',
      password: 'password123',
    },
  },
];

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(endpoints[0]);
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(endpoints[0].sampleBody || {}, null, 2)
  );
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'rn' | 'flutter'>('curl');

  const handleSelect = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '');
    setResponseOutput(null);
  };

  const handleExecute = async () => {
    try {
      setLoading(true);
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const json = await res.json();
      setResponseOutput({ status: res.status, ok: res.ok, body: json });
    } catch (err: any) {
      setResponseOutput({ status: 500, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700 border-blue-300',
    POST: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    PUT: 'bg-amber-100 text-amber-700 border-amber-300',
    DELETE: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#17191d]">
      {/* Header */}
      <header className="bg-white border-b border-[#e9e9ec] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#17191d] hover:bg-[#eaebee] transition-colors"
            title="Back to Hishab App"
          >
            &larr;
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Behishebi
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#079be8] text-white font-mono">
                API v1.0
              </span>
            </h1>
            <p className="text-xs text-[#888]">Mobile App REST API & Developer Playground</p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#079be8] text-white hover:bg-[#0689cf] transition-colors"
        >
          Open Web & Mobile App &rarr;
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Endpoint List (Left column) */}
        <div className="md:col-span-5 space-y-2">
          <div className="text-xs font-bold uppercase text-[#888] tracking-wider px-1">
            Mobile Endpoints
          </div>
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-2 space-y-1 shadow-sm max-h-[75vh] overflow-y-auto">
            {endpoints.map((ep) => (
              <button
                key={`${ep.method}-${ep.path}`}
                onClick={() => handleSelect(ep)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5 ${
                  selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method
                    ? 'bg-[#f0f8ff] border border-[#079be8]/30 shadow-sm'
                    : 'hover:bg-[#fafafa]'
                }`}
              >
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                    methodColors[ep.method]
                  }`}
                >
                  {ep.method}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#17191d] truncate">{ep.title}</div>
                  <div className="font-mono text-[11px] text-[#888] truncate">{ep.path}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Playground Test Console (Right column) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono ${
                    methodColors[selectedEndpoint.method]
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm font-semibold text-[#17191d]">
                  {selectedEndpoint.path}
                </span>
              </div>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#079be8] text-white text-xs font-bold hover:bg-[#0689cf] transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                {loading ? 'Running...' : '▶ Send Request'}
              </button>
            </div>

            <p className="text-xs text-[#666]">{selectedEndpoint.description}</p>

            {/* Request Body Editor */}
            {selectedEndpoint.method !== 'GET' && (
              <div>
                <label className="text-xs font-bold text-[#888] uppercase block mb-1">
                  JSON Request Payload
                </label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={5}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-[#e2e2e6] bg-[#fafafa] outline-none focus:border-[#079be8]"
                />
              </div>
            )}

            {/* Response Console */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#888] uppercase">Live JSON Response</span>
                {responseOutput && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      responseOutput.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    HTTP {responseOutput.status}
                  </span>
                )}
              </div>
              <pre className="p-3.5 rounded-xl bg-[#17191d] text-emerald-400 font-mono text-xs overflow-x-auto max-h-[280px]">
                {responseOutput
                  ? JSON.stringify(responseOutput.body || responseOutput, null, 2)
                  : '// Click "Send Request" to test this endpoint live'}
              </pre>
            </div>
          </div>

          {/* Code Snippets for Mobile Developers */}
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-2">
              <span className="text-xs font-bold uppercase text-[#888]">Mobile Integration Code</span>
              <div className="flex gap-1 text-xs">
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeCodeTab === 'curl' ? 'bg-[#17191d] text-white' : 'text-[#666] hover:bg-[#f0f0f2]'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeTab('rn')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeCodeTab === 'rn' ? 'bg-[#17191d] text-white' : 'text-[#666] hover:bg-[#f0f0f2]'
                  }`}
                >
                  React Native
                </button>
                <button
                  onClick={() => setActiveCodeTab('flutter')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeCodeTab === 'flutter' ? 'bg-[#17191d] text-white' : 'text-[#666] hover:bg-[#f0f0f2]'
                  }`}
                >
                  Flutter (Dart)
                </button>
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-[#202124] text-gray-200 font-mono text-xs overflow-x-auto">
              {activeCodeTab === 'curl' &&
                `curl -X ${selectedEndpoint.method} "https://your-domain.com${selectedEndpoint.path}" \\
  -H "Authorization: Bearer hr_live_mock_token" \\
  -H "Content-Type: application/json"${
    selectedEndpoint.method !== 'GET' && requestBody ? ` \\\n  -d '${requestBody.replace(/\n\s*/g, ' ')}'` : ''
  }`}

              {activeCodeTab === 'rn' &&
                `// React Native / Expo API Call
import { HishabMobileClient } from './mobile/HishabClient';

const client = new HishabMobileClient({
  baseUrl: 'https://your-domain.com'
});

const data = await client.getDashboard();`}

              {activeCodeTab === 'flutter' &&
                `// Flutter HTTP request
import 'package:http/http.dart' as http;

final response = await http.${selectedEndpoint.method.toLowerCase()}(
  Uri.parse('https://your-domain.com${selectedEndpoint.path}'),
  headers: {
    'Authorization': 'Bearer hr_live_mock_token',
    'Content-Type': 'application/json',
  },${selectedEndpoint.method !== 'GET' && requestBody ? `\n  body: jsonEncode(${requestBody.replace(/\n/g, '')}),` : ''}
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

