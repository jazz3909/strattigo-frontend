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

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
      await checkoutSession("price_1THvxxGm99mbwFrz8JgalyyA", promoApplied ? promoCode : undefined);
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
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-base font-bold gradient-text">Strattigo</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium flex items-center gap-1.5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
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
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border"
          style={{ background: "var(--accent-dim)", color: "var(--accent)", borderColor: "var(--accent-dim)" }}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>
          Study smarter,{" "}
          <span className="gradient-text">not harder</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Start free. Upgrade when you need unlimited AI power for all your courses.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="grid md:grid-cols-3 gap-6 items-start">

          {/* Free */}
          <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Free</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Perfect for trying out Strattigo</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>$0</span>
              <span className="text-sm pb-1" style={{ color: "var(--text-tertiary)" }}>/forever</span>
            </div>
            <Link
              href="/signup"
              className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm mb-7 transition-colors border"
              style={{ background: "var(--surface-2)", color: "var(--text-primary)", borderColor: "var(--border)" }}
            >
              Get Started Free
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--success)" } as React.CSSProperties} />
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro — highlighted */}
          <div
            className="rounded-2xl p-7 relative"
            style={{ background: "var(--surface)", border: "2px solid var(--accent)", boxShadow: "0 0 40px -4px rgba(255,176,117,0.3)" }}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full shadow-lg"
                style={{ background: "var(--accent)", color: "#0a0a0f" }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Most Popular
              </span>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Pro</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>For serious students who want it all</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>$7</span>
              <span className="text-sm pb-1" style={{ color: "var(--text-tertiary)" }}>/month</span>
            </div>
            <button
              onClick={handleProCheckout}
              disabled={proLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm mb-7 btn-press transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              style={{ background: "var(--accent)", color: "#0a0a0f" }}
            >
              {proLoading ? <Spinner size="sm" className="border-black/20 border-t-black/60" /> : null}
              Upgrade to Pro
            </button>
            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" } as React.CSSProperties} />
                  <span style={{ color: "var(--text-primary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Annual */}
          <div className="rounded-2xl p-7 relative" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-lg">
                Best Value
              </span>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Annual</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Save 42% vs monthly — 2 months free</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>$49</span>
              <span className="text-sm pb-1" style={{ color: "var(--text-tertiary)" }}>/year</span>
            </div>
            <button
              onClick={handleAnnualCheckout}
              disabled={annualLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm mb-7 bg-emerald-600 text-white hover:bg-emerald-500 btn-press transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg cursor-pointer"
            >
              {annualLoading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : null}
              Get Annual — Best Value
            </button>
            <ul className="space-y-3">
              {ANNUAL_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Checkout error */}
        {checkoutError && (
          <div
            className="mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm max-w-2xl mx-auto border"
            style={{ background: "var(--color-error-bg)", borderColor: "var(--color-error-border)", color: "var(--danger)" }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {checkoutError}
          </div>
        )}

        {/* Promo code */}
        <div className="mt-8 max-w-sm mx-auto">
          <p className="text-center text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>Have a promo code?</p>
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
              className="flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none transition-all"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "";
              }}
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={{ background: "var(--surface-3)", color: "var(--text-primary)" }}
            >
              Apply
            </button>
          </div>
          {promoApplied && (
            <p className="mt-2 text-sm flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <CheckIcon className="w-4 h-4" />
              Promo code applied — discount will appear at checkout
            </p>
          )}
          {promoError && (
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>{promoError}</p>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-10 text-center text-sm space-y-2" style={{ color: "var(--text-tertiary)" }}>
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: "var(--accent)" }}>
              Log in
            </Link>
          </p>
          <p className="text-xs">
            No credit card required for free plan · Cancel anytime · Secure checkout via Stripe
          </p>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
