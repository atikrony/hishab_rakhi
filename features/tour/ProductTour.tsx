'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLedger } from '@/features/ledger/LedgerContext';

/**
 * First-run, 4-step guided tour. Each step spotlights a real control
 * (found via data-tour="…"); the first matching *visible* target wins, so the
 * same steps work on mobile and desktop. Steps 1–2 advance automatically when
 * the user actually adds money / an expense.
 */

type Hint = Record<string, string>;
interface Step {
  title: string;
  targets: string[];
  hint: Hint; // body text per matched target
  fallback: string; // body text when no target is on screen
}

const STEPS: Step[] = [
  {
    title: 'Add money you receive',
    targets: ['add-money-btn', 'nav-pocket'],
    hint: {
      'nav-pocket': 'Start here: open Add Money to record income like your salary.',
      'add-money-btn': 'Tap here and enter what you received. Your balance updates instantly.',
    },
    fallback: 'Record money you receive, like your salary, from the Add Money page.',
  },
  {
    title: 'Record what you spend',
    targets: ['add-expense-btn', 'nav-spend'],
    hint: {
      'nav-spend': 'Nice! Now open Spend to record an expense.',
      'add-expense-btn': 'Add each purchase here so you always know where your money went.',
    },
    fallback: 'Record your expenses from the Spend page.',
  },
  {
    title: 'See your summary & savings plan',
    targets: ['savings-plan', 'nav-summary'],
    hint: {
      'nav-summary': 'Open Summary to see where your money goes.',
      'savings-plan': 'Tap here for a plan of how much to save and where to cut back, based on your own spending.',
    },
    fallback: 'Summary shows where your money goes and suggests how much to save.',
  },
  {
    title: 'Set your salary',
    targets: ['settings'],
    hint: {
      settings: 'In Settings, set your salary and payday. It will be added to your wallet automatically every month. You can also switch light and dark mode here.',
    },
    fallback: 'Open Settings to set your salary and payday.',
  },
];

const PAD = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findTarget(keys: string[]): { key: string; el: HTMLElement } | null {
  for (const key of keys) {
    const els = document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return { key, el };
    }
  }
  return null;
}

export function ProductTour() {
  const {
    user,
    transactions,
    isInflowModalOpen,
    isExpenseModalOpen,
    isSettingsOpen,
    isSavingsPlanOpen,
    isShareOpen,
    selectedTx,
  } = useLedger();

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<{ key: string; rect: Rect } | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const scrolledFor = useRef<string | null>(null);
  const baseline = useRef<{ income: number; expense: number } | null>(null);
  const sawPlan = useRef(false);

  const counts = useMemo(
    () => ({
      income: transactions.filter((t) => t.type === 'income' && !t.isFixedCost).length,
      expense: transactions.filter((t) => t.type === 'expense' && !t.isFixedCost).length,
    }),
    [transactions]
  );

  const doneKey = user.id ? `hr-tour-done:${user.id}` : null;

  // Decide whether this account still needs the tour. It is shown once, on the
  // first sign-in: as soon as it starts we record it as done (locally and on the
  // server), so leaving mid-tour or signing in again never brings it back.
  useEffect(() => {
    if (!doneKey) return;
    if (localStorage.getItem(doneKey)) return;
    let alive = true;
    fetch('/api/v1/auth/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j?.success) return;
        localStorage.setItem(doneKey, '1');
        if (j.data?.onboardingCompleted === false) {
          setActive(true);
          fetch('/api/v1/onboarding', { method: 'POST' }).catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [doneKey]);

  const finish = useCallback(() => {
    setActive(false);
    if (doneKey) localStorage.setItem(doneKey, '1');
    fetch('/api/v1/onboarding', { method: 'POST' }).catch(() => {});
  }, [doneKey]);

  const next = useCallback(() => {
    setStep((s) => {
      if (s >= STEPS.length - 1) {
        finish();
        return s;
      }
      return s + 1;
    });
  }, [finish]);

  // Snapshot counts at the start of each step
  useEffect(() => {
    if (!active) return;
    baseline.current = { ...counts };
    sawPlan.current = false;
    scrolledFor.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // Auto-advance when the user does the step's action
  useEffect(() => {
    if (!active || !baseline.current) return;
    if (step === 0 && counts.income > baseline.current.income) next();
    else if (step === 1 && counts.expense > baseline.current.expense) next();
  }, [active, step, counts, next]);

  useEffect(() => {
    if (!active) return;
    if (step === 2) {
      if (isSavingsPlanOpen) sawPlan.current = true;
      else if (sawPlan.current) next();
    }
    if (step === 3 && isSettingsOpen) finish();
  }, [active, step, isSavingsPlanOpen, isSettingsOpen, next, finish]);

  // Track the spotlight target (handles route changes, scrolling, resizing)
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const found = findTarget(STEPS[step].targets);
      if (!found) {
        setTarget(null);
        return;
      }
      if (scrolledFor.current !== found.key) {
        scrolledFor.current = found.key;
        const r0 = found.el.getBoundingClientRect();
        if (r0.top < 60 || r0.bottom > window.innerHeight - 90) {
          found.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      const r = found.el.getBoundingClientRect();
      setTarget({ key: found.key, rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
    };
    tick();
    const id = window.setInterval(tick, 200);
    window.addEventListener('resize', tick);
    window.addEventListener('scroll', tick, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', tick);
      window.removeEventListener('scroll', tick, true);
    };
  }, [active, step]);

  const modalOpen =
    isInflowModalOpen || isExpenseModalOpen || isSettingsOpen || isSavingsPlanOpen || isShareOpen || !!selectedTx;

  if (!active || modalOpen) return null;

  const s = STEPS[step];
  const body = target ? s.hint[target.key] || s.fallback : s.fallback;

  const hole = target
    ? {
        top: target.rect.top - PAD,
        left: target.rect.left - PAD,
        width: target.rect.width + PAD * 2,
        height: target.rect.height + PAD * 2,
      }
    : null;

  // Tooltip placement
  const vw = viewport.w || 1024;
  const vh = viewport.h || 768;
  const isNarrow = vw < 640;
  const tipW = isNarrow ? vw - 24 : 330;
  const tipStyle: React.CSSProperties = { width: tipW };
  if (!hole) {
    tipStyle.top = '50%';
    tipStyle.left = '50%';
    tipStyle.transform = 'translate(-50%, -50%)';
  } else if (!isNarrow && hole.left + hole.width < 300) {
    // Desktop sidebar target: place to the right
    tipStyle.left = hole.left + hole.width + 16;
    tipStyle.top = Math.max(12, Math.min(hole.top - 8, vh - 260));
  } else {
    tipStyle.left = isNarrow
      ? 12
      : Math.max(12, Math.min(hole.left + hole.width / 2 - tipW / 2, vw - tipW - 12));
    if (hole.top + hole.height / 2 > vh / 2) tipStyle.bottom = vh - hole.top + 12;
    else tipStyle.top = hole.top + hole.height + 12;
  }

  const blockerClass = 'fixed bg-transparent';
  const swallow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-[48] pointer-events-none" role="dialog" aria-modal="true" aria-label="App tour">
      {/* Click blockers around the spotlight; the hole itself stays clickable */}
      <div className="pointer-events-auto" onClick={swallow}>
        {hole ? (
          <>
            <div className={blockerClass} style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
            <div className={blockerClass} style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
            <div className={blockerClass} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
            <div className={blockerClass} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          </>
        ) : (
          <div className="fixed inset-0 bg-[rgb(10_8_30/0.55)]" />
        )}
      </div>

      {/* Spotlight */}
      {hole && (
        <div
          className="fixed rounded-2xl tour-spotlight transition-all duration-300 ease-out"
          style={{ ...hole, boxShadow: '0 0 0 9999px rgb(10 8 30 / 0.55)' }}
        />
      )}

      {/* Tooltip */}
      <div
        key={step}
        className="fixed pointer-events-auto modal-panel !p-5 !rounded-2xl"
        style={tipStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-outline-variant'}`}
              />
            ))}
          </div>
          <span className="text-label-sm font-bold text-on-surface-variant">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <h3 className="font-title-sm text-title-sm font-bold text-on-surface">{s.title}</h3>
        <p className="text-body-md text-on-surface-variant mt-1">{body}</p>
        <div className="flex items-center justify-between mt-4">
          <button type="button" onClick={finish} className="text-label-md font-semibold text-on-surface-variant hover:text-on-surface">
            Skip tour
          </button>
          <button
            type="button"
            onClick={next}
            className="px-4 h-9 rounded-xl bg-primary text-on-primary text-label-md font-bold shadow-md active:scale-95 transition-transform"
          >
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
