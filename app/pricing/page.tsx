"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkoutSession, MONTHLY_PRICE_ID, ANNUAL_PRICE_ID } from "../lib/stripe";
import { getToken } from "../lib/api";
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

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
};

const ghostButton: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--text-primary)",
  fontWeight: 600,
};

function ghostHover(e: React.MouseEvent<HTMLElement>, on: boolean) {
  e.currentTarget.style.borderColor = on ? "var(--accent)" : "rgba(255,255,255,0.1)";
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [annualLoading, setAnnualLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  async function startCheckout(priceId: string, setLoading: (v: boolean) => void) {
    // The checkout endpoint requires a Bearer token and rejects anonymous
    // requests with 403 (which bypasses the global 401 handler), so gate
    // here: logged-out users go to signup, which routes free accounts back
    // to /pricing after registration.
    if (!getToken()) {
      router.push("/signup");
      return;
    }
    setLoading(true);
    setCheckoutError("");
    try {
      await checkoutSession(priceId, promoApplied ? promoCode.trim() : undefined);
      // Success navigates to Stripe; keep the spinner until the page unloads.
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setLoading(false);
    }
  }

  function handleApplyPromo() {
    setPromoError("");
    const code = promoCode.trim();
    if (!code) {
      setPromoError("Please enter a promo code.");
      return;
    }
    setPromoCode(code);
    setPromoApplied(true);
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "rgba(13,16,24,0.22)",
        backdropFilter: "blur(40px) saturate(120%)",
        WebkitBackdropFilter: "blur(40px) saturate(120%)",
        color: "var(--text-primary)",
      }}
    >
      <style>{`.promo-input::placeholder { color: var(--text-tertiary); }`}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(13,16,24,0.35)",
          backdropFilter: "blur(20px) saturate(120%)",
          WebkitBackdropFilter: "blur(20px) saturate(120%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href={authed ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-base gradient-text" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700 }}>
              Strattigo
            </span>
          </Link>
          {authed ? (
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
          ) : (
            <Link href="/login" className="text-sm font-semibold transition-colors" style={{ color: "var(--accent)" }}>
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(225,148,133,0.3)",
            color: "var(--accent)",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Simple, transparent pricing
        </div>
        <h1
          className="text-4xl sm:text-5xl mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}
        >
          Study smarter, <span style={{ color: "var(--accent)" }}>not harder</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Start free. Upgrade when you need unlimited AI power for all your courses.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="grid md:grid-cols-3 gap-6 items-start">

          {/* Free */}
          <div className="p-7" style={glassCard}>
            <h2 className="text-lg mb-1" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}>
              Free
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Perfect for trying out Strattigo</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}>
                $0
              </span>
              <span className="text-sm pb-1" style={{ color: "var(--text-tertiary)" }}>/forever</span>
            </div>
            <Link
              href={authed ? "/dashboard" : "/signup"}
              className="flex items-center justify-center w-full py-3 rounded-xl text-sm mb-7 transition-all"
              style={ghostButton}
              onMouseEnter={(e) => ghostHover(e, true)}
              onMouseLeave={(e) => ghostHover(e, false)}
            >
              Get Started Free
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro — highlighted */}
          <div
            className="p-7 relative"
            style={{
              ...glassCard,
              border: "1px solid var(--accent)",
              boxShadow: "0 8px 40px rgba(225,148,133,0.15)",
            }}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full shadow-lg"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Most Popular
              </span>
            </div>
            <h2 className="text-lg mb-1" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}>
              Pro
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>For serious students who want it all</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}>
                $7
              </span>
              <span className="text-sm pb-1" style={{ color: "var(--text-tertiary)" }}>/month</span>
            </div>
            <button
              onClick={() => startCheckout(MONTHLY_PRICE_ID, setProLoading)}
              disabled={proLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm mb-7 btn-press transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff", fontWeight: 600 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              {proLoading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : null}
              Upgrade to Pro
            </button>
            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Annual */}
          <div className="p-7 relative" style={glassCard}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full"
                style={{ background: "rgba(225,148,133,0.12)", color: "var(--accent)" }}
              >
                Best Value
              </span>
            </div>
            <h2 className="text-lg mb-1" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}>
              Annual
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Save 42% vs monthly — 2 months free</p>
            <div className="flex items-end gap-1.5 mb-6">
              <span className="text-4xl" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, color: "var(--text-primary)" }}>
                $49
              </span>
              <span className="text-sm pb-1" style={{ color: "var(--text-tertiary)" }}>/year</span>
            </div>
            <button
              onClick={() => startCheckout(ANNUAL_PRICE_ID, setAnnualLoading)}
              disabled={annualLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm mb-7 btn-press transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={ghostButton}
              onMouseEnter={(e) => ghostHover(e, true)}
              onMouseLeave={(e) => ghostHover(e, false)}
            >
              {annualLoading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : null}
              Get Annual — Best Value
            </button>
            <ul className="space-y-3">
              {ANNUAL_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Checkout error */}
        {checkoutError && (
          <div
            className="mt-6 flex items-center gap-3 px-5 py-4 text-sm max-w-2xl mx-auto"
            style={{
              background: "rgba(229,115,115,0.08)",
              border: "1px solid rgba(229,115,115,0.3)",
              borderRadius: 14,
              color: "var(--danger)",
            }}
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
              className="promo-input flex-1 px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(225,148,133,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "";
              }}
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2.5 text-sm transition-colors cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff", fontWeight: 600, borderRadius: 12 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              Apply
            </button>
          </div>
          {promoApplied && (
            <p className="mt-2 text-sm flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
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
          {!authed && (
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold transition-colors" style={{ color: "var(--accent)" }}>
                Log in
              </Link>
            </p>
          )}
          <p className="text-xs">
            No credit card required for free plan · Cancel anytime · Secure checkout via Stripe
          </p>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
