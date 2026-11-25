'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLedger } from '@/features/ledger/LedgerContext';

interface ShareLink {
  token: string;
  month: string;
  access: 'restricted' | 'anyone';
  emails: string[];
  createdAt: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

const linkFor = (token: string) =>
  typeof window === 'undefined' ? `/share/${token}` : `${window.location.origin}/share/${token}`;

export function ShareModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast } = useLedger();
  const [month, setMonth] = useState(currentMonth());
  const [access, setAccess] = useState<'restricted' | 'anyone'>('restricted');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/shares', { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (json.success) setLinks(json.data);
  }, []);

  useEffect(() => {
    if (isOpen) {
      load();
      setJustCreated(null);
      setError(null);
    }
  }, [isOpen, load]);

  if (!isOpen) return null;

  const addEmail = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const bad = parts.find((p) => !EMAIL_RE.test(p));
    if (bad) {
      setError(`"${bad}" isn't a valid email.`);
      return;
    }
    setError(null);
    setEmails((cur) => [...new Set([...cur, ...parts])].slice(0, 20));
    setEmailDraft('');
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      showToast('Link copied');
    } catch {
      showToast(linkFor(token));
    }
  };

  const create = async () => {
    const pending = emailDraft.trim() ? [...emails, emailDraft.trim().toLowerCase()] : emails;
    if (emailDraft.trim() && !EMAIL_RE.test(emailDraft.trim())) {
      setError(`"${emailDraft.trim()}" isn't a valid email.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, access, emails: pending }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not create link.');
      setEmails([]);
      setEmailDraft('');
      setJustCreated(json.data.token);
      await load();
      copy(json.data.token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleAccess = async (l: ShareLink) => {
    const nextAccess = l.access === 'anyone' ? 'restricted' : 'anyone';
    if (nextAccess === 'restricted' && l.emails.length === 0) {
      showToast('Add people to this link first by creating a new restricted link.');
      return;
    }
    const res = await fetch(`/api/v1/shares/${l.token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access: nextAccess }),
    });
    if (res.ok) load();
  };

  const remove = async (l: ShareLink) => {
    if (!confirm('Turn off this link? People using it will lose access.')) return;
    const res = await fetch(`/api/v1/shares/${l.token}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Link turned off');
      load();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Share spending</h3>
            <p className="text-label-md text-on-surface-variant">A read-only receipt of one month.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full glass-input flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Create */}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Month</span>
            <input
              type="month"
              value={month}
              max={currentMonth()}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="h-11 px-3 rounded-xl glass-input text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Who can open it</span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-input">
              {(
                [
                  ['restricted', 'lock', 'Only people I add'],
                  ['anyone', 'public', 'Anyone with link'],
                ] as const
              ).map(([val, icon, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAccess(val)}
                  className={`h-10 rounded-lg flex items-center justify-center gap-1.5 text-label-md font-semibold transition-all ${
                    access === val ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {access === 'restricted' && (
            <div className="flex flex-col gap-1 animate-fadeIn">
              <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">People</span>
              <div className="min-h-11 px-2 py-1.5 rounded-xl glass-input flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-primary/30">
                {emails.map((e) => (
                  <span key={e} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-semibold">
                    {e}
                    <button
                      type="button"
                      aria-label={`Remove ${e}`}
                      onClick={() => setEmails((cur) => cur.filter((x) => x !== e))}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/20"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && emailDraft.trim()) {
                      e.preventDefault();
                      addEmail(emailDraft);
                    } else if (e.key === 'Backspace' && !emailDraft && emails.length) {
                      setEmails((cur) => cur.slice(0, -1));
                    }
                  }}
                  onBlur={() => emailDraft.trim() && addEmail(emailDraft)}
                  placeholder={emails.length ? '' : 'name@example.com'}
                  className="flex-1 min-w-[140px] h-8 bg-transparent outline-none text-body-md text-on-surface px-1"
                />
              </div>
              <span className="text-label-sm text-on-surface-variant">They must sign in with this email to view.</span>
            </div>
          )}

          {error && <p className="text-label-md text-error font-semibold">{error}</p>}

          <button type="button" onClick={create} disabled={busy} className="btn-gradient h-12 mt-1">
            <span className="material-symbols-outlined text-[18px]">link</span>
            {busy ? 'Creating…' : 'Create & copy link'}
          </button>
        </div>

        {/* Existing links */}
        {links.length > 0 && (
          <div className="mt-6">
            <h4 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">Your links</h4>
            <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {links.map((l) => (
                <li
                  key={l.token}
                  className={`p-3 rounded-xl glass-input flex items-center gap-3 ${justCreated === l.token ? 'ring-2 ring-primary/50' : ''}`}
                >
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{l.access === 'anyone' ? 'public' : 'lock'}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-md font-semibold text-on-surface">{monthLabel(l.month)}</div>
                    <div className="text-label-sm text-on-surface-variant truncate">
                      {l.access === 'anyone' ? 'Anyone with the link' : l.emails.join(', ')}
                    </div>
                  </div>
                  <button type="button" onClick={() => copy(l.token)} title="Copy link" className="icon-btn">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAccess(l)}
                    title={l.access === 'anyone' ? 'Restrict to added people' : 'Allow anyone with link'}
                    className="icon-btn"
                  >
                    <span className="material-symbols-outlined text-[18px]">{l.access === 'anyone' ? 'lock' : 'public'}</span>
                  </button>
                  <button type="button" onClick={() => remove(l)} title="Turn off link" className="icon-btn hover:!text-error">
                    <span className="material-symbols-outlined text-[18px]">link_off</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
