"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkoutSession, getSubscriptionStatus, MONTHLY_PRICE_ID } from "../lib/stripe";
import { getToken } from "../lib/api";
import { PublicNav, PublicBody, PublicHead } from "@/components/public/public-shell";
import { FREE_FEATURES, PRO_FEATURES, PRICE_MONTHLY } from "@/components/public/plans";
import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { cn } from "@/lib/utils";

// Plan copy lives in components/public/plans.ts — the single source for every
// public pricing surface. FREE mirrors the backend's real quotas; PRO's
// "Unlimited" wording is deliberate marketing (owner's call, 2026-07-12) even
// though the backend enforces generous caps. Keep changes there, not here.

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 019.54 6.97l-2.85.93A7 7 0 0012 5V2z"
      />
    </svg>
  );
}

function PlanFeatures({ features }: { features: readonly string[] }) {
  return (
    <ul className="mb-6 space-y-[11px]">
      {features.map((f) => (
        <li key={f} className="flex gap-2.5 text-ui text-ink-soft">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
          {f}
        </li>
      ))}
    </ul>
  );
}

function PlanPrice({ amount, per }: { amount: string; per: string }) {
  return (
    <div className="mb-[22px] flex items-baseline gap-1.5">
      <span className="font-display text-[42px] leading-none font-semibold tracking-[-0.02em] text-ink">
        {amount}
      </span>
      <span className="text-[15px] text-ink-faint">{per}</span>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (!getToken()) return;
    setAuthed(true);
    getSubscriptionStatus()
      .then(({ plan }) => setSubscribed(plan === "pro" || plan === "annual"))
      .catch(() => {
        // unknown status — keep showing the upgrade CTAs
      });
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
      await checkoutSession(priceId);
      // Success navigates to Stripe; keep the spinner until the page unloads.
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page px-4 pb-16 font-sans text-ink sm:px-6">
      <PublicNav brandHref={authed ? "/dashboard" : "/"}>
        {authed ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-ui font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-ui font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Log in
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ variant: "primary" }))}>
              Start free
            </Link>
          </>
        )}
      </PublicNav>

      <PublicBody>
        <PublicHead eyebrow="Pricing" title="Simple pricing, no decoding">
          Start free. Go Pro when you&apos;re taking on the whole semester.
        </PublicHead>

        <div className="mx-auto grid max-w-[720px] items-start gap-[22px] sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-xl border border-rule bg-raised p-[30px]">
            <h2 className="mb-1.5 font-display text-[21px] font-semibold text-ink">Free</h2>
            <PlanPrice amount="$0" per="forever" />
            <PlanFeatures features={FREE_FEATURES} />
            <Link
              href={authed ? "/dashboard" : "/signup"}
              className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div className="relative rounded-xl border-[2.5px] border-accent bg-raised p-[30px]">
            <span className="absolute -top-[13px] left-[30px] rounded-full bg-accent px-[13px] py-[5px] text-xs font-semibold text-white">
              For serious semesters
            </span>
            <h2 className="mb-1.5 font-display text-[21px] font-semibold text-ink">Pro</h2>
            <PlanPrice amount={PRICE_MONTHLY} per="/ month" />
            <PlanFeatures features={PRO_FEATURES} />
            {subscribed ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
              >
                <CheckIcon className="size-4 text-success" />
                You&apos;re on Pro
              </Link>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                disabled={proLoading}
                onClick={() => startCheckout(MONTHLY_PRICE_ID, setProLoading)}
              >
                {proLoading && <Spinner />}
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        {checkoutError && (
          <Callout variant="error" className="mx-auto mt-6 max-w-[720px]">
            {checkoutError}
          </Callout>
        )}

        <div className="mt-10 space-y-2 text-center">
          {!authed && (
            <p className="text-ui text-ink-soft">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-accent-deep hover:underline">
                Log in
              </Link>
            </p>
          )}
          <p className="text-ui-s text-ink-faint">
            No credit card required for free plan · Cancel anytime · Secure checkout via Stripe
          </p>
        </div>
      </PublicBody>
    </div>
  );
}
