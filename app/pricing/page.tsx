"use client";

import { useState } from "react";
import Link from "next/link";
import { checkoutSession, MONTHLY_PRICE_ID, ANNUAL_PRICE_ID } from "../lib/stripe";
import { Spinner } from "../components/ui/Spinner";

const FREE_FEATURES = [
  "Up to 3 courses",
  "10 AI generations / month",
  "Study guides & quizzes",
  "AI chat (50 messages/mo)",
  "PDF & document upload",
];

const PRO_FEATURES = [
  "Unlimited courses",
  "Unlimited AI generations",
  "Study guides, quizzes & plans",
  "Unlimited AI chat",
  "Canvas LMS integration",
  "Priority AI generation",
  "Export to PDF",
];

const ANNUAL_FEATURES = [
  "Everything in Pro",
  "2 months free vs monthly",
  "Unlimited courses",
  "Unlimited AI generations",
  "Study guides, quizzes & plans",
  "Unlimited AI chat",
  "Canvas LMS integration",
  "Priority AI generation",
  "Export to PDF",
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function PricingPage() {
  const [proLoading, setProLoading] = useState(false);
  const [annualLoading, setAnnualLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  async function handleProCheckout() {
    setProLoading(true);
    setCheckoutError("");
    try {
      await checkoutSession(MONTHLY_PRICE_ID, promoApplied ? promoCode : undefined);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setProLoading(false);
    }
  }

  async function handleAnnualCheckout() {
    setAnnualLoading(true);
    setCheckoutError("");
    try {
      await checkoutSession(ANNUAL_PRICE_ID, promoApplied ? promoCode : undefined);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setAnnualLoading(false);
    }
  }

  function handleApplyPromo() {
    setPromoError("");
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code.");
      return;
    }
    setPromoApplied(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Strattigo
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
          Study smarter,{" "}
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            not harder
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Start free. Upgrade when you need unlimited AI power for all your courses.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="grid md:grid-cols-3 gap-6 items-start">

          {/* Free */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-7">
            <h2 className="text-lg font-bold text-white mb-1">Free</h2>
            <p className="text-sm text-slate-400 mb-6">Perfect for trying out Strattigo</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-sm text-slate-500 pb-1">/forever</span>
            </div>
            <Link
              href="/signup"
              className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm mb-7 bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              Get Started Free
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro — highlighted */}
          <div className="rounded-2xl bg-slate-900 border-2 border-violet-500 p-7 relative shadow-[0_0_40px_-4px_rgba(124,58,237,0.4)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-lg">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Most Popular
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Pro</h2>
            <p className="text-sm text-slate-400 mb-6">For serious students who want it all</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl font-extrabold text-white">$7</span>
              <span className="text-sm text-slate-500 pb-1">/month</span>
            </div>
            <button
              onClick={handleProCheckout}
              disabled={proLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm mb-7 bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            >
              {proLoading ? <Spinner size="sm" /> : null}
              Upgrade to Pro
            </button>
            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0 text-violet-400" />
                  <span className="text-slate-200">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Annual */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-7 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-lg">
                Best Value
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Annual</h2>
            <p className="text-sm text-slate-400 mb-6">Save 42% vs monthly — 2 months free</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl font-extrabold text-white">$49</span>
              <span className="text-sm text-slate-500 pb-1">/year</span>
            </div>
            <button
              onClick={handleAnnualCheckout}
              disabled={annualLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm mb-7 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            >
              {annualLoading ? <Spinner size="sm" /> : null}
              Get Annual — Best Value
            </button>
            <ul className="space-y-3">
              {ANNUAL_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Checkout error */}
        {checkoutError && (
          <div className="mt-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-5 py-4 text-sm max-w-2xl mx-auto">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {checkoutError}
          </div>
        )}

        {/* Promo code */}
        <div className="mt-8 max-w-sm mx-auto">
          <p className="text-center text-sm text-slate-500 mb-3">Have a promo code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoApplied(false);
                setPromoError("");
              }}
              placeholder="Enter promo code"
              className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
            >
              Apply
            </button>
          </div>
          {promoApplied && (
            <p className="mt-2 text-sm text-emerald-400 flex items-center gap-1.5">
              <CheckIcon className="w-4 h-4" />
              Promo code applied — discount will appear at checkout
            </p>
          )}
          {promoError && (
            <p className="mt-2 text-sm text-red-400">{promoError}</p>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-10 text-center text-sm text-slate-500 space-y-2">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Log in
            </Link>
          </p>
          <p className="text-xs">
            No credit card required for free plan · Cancel anytime · Secure checkout via Stripe
          </p>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-16" />
    </div>
  );
}
