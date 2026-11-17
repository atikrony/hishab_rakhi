'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Redirect to login page to sign in
      window.location.href = `/auth/login?registered=true&email=${encodeURIComponent(email.trim())}`;
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
            Private Solo Ledger
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-space-sm tracking-tight">
            Create Your Account
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Sign up to track your solo income, expenses, and pocket money.
          </p>
        </div>

        {/* Google OAuth Button */}
        <a
          href="/api/v1/auth/google"
          className="w-full h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-3 border border-surface-container transition-all active:scale-[0.99] shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.6H1.26C.46 8.2.01 10.04.01 12c0 1.95.45 3.8 1.25 5.4l4.02-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.6l4.02 3.13c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3 text-on-surface-variant/40 -mt-2">
          <div className="flex-1 h-px bg-surface-container" />
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium">
            or with email
          </span>
          <div className="flex-1 h-px bg-surface-container" />
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
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Password *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant material-symbols-outlined text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Confirm Password *
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
                placeholder="Re-enter password"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-body-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
              />
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register & Continue</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-space-xs border-t border-surface-container">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-bold transition-colors ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-outline text-label-sm font-medium mt-6">
        <span className="material-symbols-outlined text-[16px]">verified_user</span>
        <span>Isolated Solo Ledger • Encrypted Session • Zero Data Leakage</span>
      </div>
    </div>
  );
}

