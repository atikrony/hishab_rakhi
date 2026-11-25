'use client';

import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '@/lib/types';
import { useTheme } from '@/lib/theme';
import { useLedger } from '@/features/ledger/LedgerContext';
import { resizeImageToDataUrl } from '@/lib/image-resize';
import { nextPayDate } from '@/lib/salary';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout?: () => void;
  databaseMode?: 'dummy' | 'real';
  databaseFile?: string;
}

const isGeneratedAvatar = (url?: string) => !url || url.startsWith('https://api.dicebear.com/');

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function initialDay(user: UserProfile): string {
  if (user.salaryDay) return String(user.salaryDay);
  const m = /^\d{4}-\d{2}-(\d{2})/.exec(user.salaryDate || '');
  return m ? String(Number(m[1])) : '';
}

export function SettingsModal({ isOpen, onClose, user, onLogout }: SettingsModalProps) {
  const { theme, toggleTheme } = useTheme();
  const { fetchData, showToast, setIsShareOpen } = useLedger();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [salary, setSalary] = useState('');
  const [payday, setPayday] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSalary(user.monthlyIncome ? String(user.monthlyIncome) : '');
      setPayday(initialDay(user));
      setSalaryError(null);
    }
    // Only reset the form when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const putProfile = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/v1/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.error || 'Could not save.');
  };

  const saveAvatar = async (payload: { avatar?: string; removeAvatar?: boolean }) => {
    setUploading(true);
    try {
      await putProfile(payload);
      await fetchData();
      showToast(payload.removeAvatar ? 'Photo removed' : 'Photo updated');
    } catch (err: any) {
      showToast(err?.message || 'Could not update photo.');
    } finally {
      setUploading(false);
    }
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await saveAvatar({ avatar: await resizeImageToDataUrl(file) });
    } catch (err: any) {
      showToast(err?.message || "Couldn't read that image.");
    }
  };

  const saveSalary = async (turnOff = false) => {
    setSalaryError(null);
    const amount = Number(salary);
    if (!turnOff) {
      if (!salary || !Number.isInteger(amount) || amount <= 0) return setSalaryError('Enter your monthly salary.');
      if (!payday) return setSalaryError('Choose your payday.');
    }
    setSavingSalary(true);
    try {
      await putProfile(turnOff ? { salaryDay: null } : { monthlyIncome: amount, salaryDay: Number(payday) });
      await fetchData();
      if (turnOff) setPayday('');
      showToast(turnOff ? 'Automatic salary turned off' : 'Salary saved');
    } catch (err: any) {
      setSalaryError(err?.message || 'Could not save salary.');
    } finally {
      setSavingSalary(false);
    }
  };

  const savedActive = !!user.salaryDay && (user.monthlyIncome || 0) > 0;
  const dirty =
    salary !== (user.monthlyIncome ? String(user.monthlyIncome) : '') || payday !== (user.salaryDay ? String(user.salaryDay) : '');
  const next = savedActive ? nextPayDate(user.salaryDay!) : null;

  const rowClass =
    'w-full flex items-center justify-between p-3 rounded-xl glass-input hover:bg-surface-container transition-colors text-left';
  const labelClass = 'text-label-sm font-bold uppercase tracking-wider text-on-surface-variant';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-md max-h-[92dvh] overflow-y-auto space-y-space-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full glass-input flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Profile + photo */}
        <div className="p-space-md rounded-2xl glass-input flex items-center gap-space-md">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="relative w-16 h-16 rounded-full flex-shrink-0 group"
          >
            <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-white/60 shadow-md" />
            <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
              {uploading ? (
                <span className="w-3 h-3 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[14px]">edit</span>
              )}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
          <div className="flex flex-col min-w-0">
            <span className="font-title-sm text-title-sm text-on-surface font-bold truncate">{user.name}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{user.email}</span>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-label-sm font-bold text-primary hover:underline">
                Change photo
              </button>
              {!isGeneratedAvatar(user.avatar) && (
                <button
                  type="button"
                  onClick={() => saveAvatar({ removeAvatar: true })}
                  disabled={uploading}
                  className="text-label-sm font-bold text-on-surface-variant hover:text-error"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="p-space-md rounded-2xl glass-input flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
            <span className="font-label-md text-label-md font-bold text-on-surface">Salary</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Monthly amount</span>
              <span className="h-11 px-3 rounded-xl bg-surface-container-lowest border border-hairline flex items-center gap-1 focus-within:ring-2 focus-within:ring-primary/30">
                <span className="font-bold text-on-surface-variant">৳</span>
                <input
                  inputMode="numeric"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="0"
                  className="w-full bg-transparent outline-none font-bold text-on-surface"
                />
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Payday</span>
              <select
                value={payday}
                onChange={(e) => setPayday(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container-lowest border border-hairline font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Day…</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {ordinal(d)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-label-sm text-on-surface-variant">
            {savedActive && next
              ? `৳${(user.monthlyIncome || 0).toLocaleString()} will be added to your wallet automatically. Next: ${next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
              : 'Set your salary and payday to add it to your wallet automatically every month.'}
            {Number(payday) > 28 && ' In shorter months it is added on the last day.'}
          </p>

          {salaryError && <p className="text-label-md text-error font-semibold">{salaryError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveSalary(false)}
              disabled={savingSalary || (!dirty && savedActive)}
              className="btn-gradient h-10 flex-1 text-label-md disabled:opacity-50"
            >
              {savingSalary ? 'Saving…' : savedActive && !dirty ? 'Saved' : 'Save salary'}
            </button>
            {savedActive && (
              <button
                type="button"
                onClick={() => saveSalary(true)}
                disabled={savingSalary}
                className="h-10 px-4 rounded-xl glass-input text-label-md font-semibold text-on-surface-variant hover:text-error"
              >
                Turn off
              </button>
            )}
          </div>
        </div>

        {/* Appearance */}
        <button type="button" role="switch" aria-checked={theme === 'dark'} onClick={toggleTheme} className={rowClass}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface">
              {theme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="font-label-md text-label-md font-semibold text-on-surface">Dark mode</span>
          </div>
          <span className={`relative w-10 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-outline-variant'}`}>
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`}
            />
          </span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={() => {
            onClose();
            setIsShareOpen(true);
          }}
          className={rowClass}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface">ios_share</span>
            <span className="font-label-md text-label-md font-semibold text-on-surface">Share spending</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-error/10 hover:bg-error/15 text-error font-label-md text-label-md font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign out</span>
          </button>
        )}
      </div>
    </div>
  );
}
