'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
      if (params.get('registered') === 'true') {
        setSuccessNotice('Account created successfully! Please sign in to access your ledger.');
      } else if (params.get('reset') === 'true') {
        setSuccessNotice('Password reset successfully! Please sign in with your new password.');
      }
      const errParam = params.get('error');
      if (errParam) {
        setError(errParam);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials. Please try again.');
        return;
      }

      // If onboarding is not completed, route to onboarding, otherwise spend page
      if (data.data?.onboardingCompleted === false) {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/spend';
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
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
            Welcome Back
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-space-sm tracking-tight">
            Sign In to Hishab Rakhi
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Access your secure personal finance ledger.
          </p>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="bg-secondary-container/30 border border-secondary/40 text-on-secondary-container rounded-xl p-space-md text-label-md font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0">
              check_circle
            </span>
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-error-container/20 border border-error/30 text-error rounded-xl p-space-md text-label-md font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}


        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          {/* Email */}
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

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Password *
              </label>
              <Link
                href="/auth/forgot-password"
                className="font-label-sm text-label-sm text-secondary hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant material-symbols-outlined text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-label-lg transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-space-xs border-t border-surface-container">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-bold transition-colors ml-1"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-outline text-label-sm font-medium mt-6">
        <span className="material-symbols-outlined text-[16px]">security</span>
        <span>Secure Session • End-to-End Solo Account Privacy</span>
      </div>
    </div>
  );
}
