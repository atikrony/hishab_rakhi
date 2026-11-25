'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      const emailParam = params.get('email');
      if (tokenParam) setToken(tokenParam);
      if (emailParam) setEmail(emailParam);

      if (!tokenParam || !emailParam) {
        setError('Missing or invalid password reset link. Please request a new one.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update password.');
        return;
      }

      // Redirect to signin with success banner
      window.location.href = `/auth/login?reset=true&email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-space-xl shadow-2xl border border-hairline flex flex-col gap-space-lg animate-fadeIn">
        {/* Brand & Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-extrabold text-2xl shadow-md mb-space-md">
            HR
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
            Set New Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {email ? `For ${email}` : 'Choose a new password.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-error-container/20 border border-error/30 text-error rounded-xl p-space-md text-label-md font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              New Password *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant material-symbols-outlined text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-surface-container-low text-on-surface text-body-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Confirm New Password *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant material-symbols-outlined text-[20px]">
                lock_reset
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-body-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-label-lg transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <span className="material-symbols-outlined text-[18px]">check</span>
              </>
            )}
          </button>
        </form>

        {/* Back link */}
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

