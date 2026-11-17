'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetUrl(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to request reset link.');
        return;
      }

      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      } else {
        setResetUrl('CHECK_EMAIL');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resetUrl && resetUrl !== 'CHECK_EMAIL') {
      navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-space-xl shadow-2xl border border-[#E5E7EB] flex flex-col gap-space-lg animate-fadeIn">
        {/* Brand & Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-extrabold text-2xl shadow-md mb-space-md">
            HR
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold bg-secondary/10 px-3 py-1 rounded-full">
            Account Recovery
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-space-sm tracking-tight">
            Forgot Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Enter your account email to receive your secure password reset link.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-error-container/20 border border-error/30 text-error rounded-xl p-space-md text-label-md font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Card with Action */}
        {resetUrl && resetUrl !== 'CHECK_EMAIL' && (
          <div className="p-4 rounded-2xl bg-secondary-container/25 border border-secondary/40 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-secondary font-bold text-label-md">
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
              <span>Reset Link Ready</span>
            </div>
            <p className="text-body-md text-on-surface-variant text-sm">
              Your secure 15-minute password reset link has been generated. Click below to set a new password:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={resetUrl}
                className="flex-1 py-2.5 px-4 rounded-xl bg-secondary text-on-secondary font-label-md font-bold text-center hover:bg-secondary/90 transition-all shadow-sm"
              >
                Proceed to Reset Password
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-surface-container text-on-surface font-label-md font-semibold hover:bg-surface-container-high transition-colors text-center"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {resetUrl === 'CHECK_EMAIL' && (
          <div className="p-4 rounded-2xl bg-secondary-container/25 border border-secondary/40 flex items-center gap-2 text-on-secondary-container font-semibold text-sm">
            <span className="material-symbols-outlined text-secondary">mark_email_read</span>
            <span>If this email is registered, password reset instructions have been dispatched.</span>
          </div>
        )}

        {/* Form */}
        {!resetUrl && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Email Address *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-on-surface-variant material-symbols-outlined text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-body-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-label-lg transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="text-center pt-space-xs border-t border-surface-container">
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-bold text-label-md inline-flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

