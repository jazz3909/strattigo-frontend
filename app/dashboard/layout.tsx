"use client";

import { usePathname, useRouter } from "next/navigation";
import { getCourses } from "../lib/api";
import { getSubscriptionStatus } from "../lib/stripe";
import { useEffect, useState } from "react";
import { OnboardingModal } from "../components/OnboardingModal";
import { GlobalNav } from "@/components/shell/global-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // The course workspace routes (chat, guides, quizzes, materials, and the
  // guide/quiz reading views) are their own full-bleed cream frames (rail +
  // top bar); they replace the global chrome rather than nesting under it.
  // The subscription gate below still runs for them. Everything else — the
  // course shelf and any centered page — renders under the shared GlobalNav.
  // (/dashboard/<courseId> itself is a pure redirect to the chat route.)
  const isWorkspaceReader =
    /^\/dashboard\/[^/]+\/(?:guide|quiz)\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/[^/]+\/(?:materials|chat|guides|quizzes)$/.test(pathname);
  const [subChecked, setSubChecked] = useState(false);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Trust the backend's canonical `is_pro` boolean first; fall back to the
    // plan string so this stays correct regardless of which the backend emits.
    const isPaid = (s: { is_pro?: boolean; plan?: string }) =>
      s.is_pro === true || s.plan === "pro" || s.plan === "annual";
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // Read the param via window.location instead of useSearchParams: this gate
    // already runs client-side only, and useSearchParams in a prerendered
    // layout would force a Suspense boundary around the whole dashboard tree.
    const fromCheckout =
      new URLSearchParams(window.location.search).get("checkout") === "success";

    async function gate() {
      if (fromCheckout) {
        // Returning from Stripe: the webhook that records the subscription can
        // lag the browser redirect by several seconds, so poll instead of
        // bouncing a just-paid user to /pricing on the first "free" response.
        setConfirmingCheckout(true);
        for (let attempt = 0; attempt < 10; attempt++) {
          if (cancelled) return;
          try {
            const status = await getSubscriptionStatus();
            if (cancelled) return;
            if (isPaid(status)) {
              router.replace(window.location.pathname);
              setConfirmingCheckout(false);
              setSubChecked(true);
              checkOnboarding();
              return;
            }
          } catch {
            // transient error — keep polling
          }
          await sleep(2000);
        }
        if (!cancelled) setConfirmTimedOut(true);
        return;
      }

      // Normal mount: a network blip must not eject a paying user — retry once
      // and only redirect on a successful response that says the plan is free.
      for (let attempt = 0; attempt < 2; attempt++) {
        if (cancelled) return;
        try {
          const status = await getSubscriptionStatus();
          if (cancelled) return;
          if (!isPaid(status)) {
            router.replace("/pricing");
          } else {
            setSubChecked(true);
            checkOnboarding();
          }
          return;
        } catch {
          if (attempt === 0) await sleep(2000);
        }
      }
      // Both attempts errored: let the user in rather than bounce; the backend
      // enforces plan limits regardless of what this client-side gate decides.
      if (!cancelled) {
        setSubChecked(true);
        checkOnboarding();
      }
    }

    gate();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function checkOnboarding() {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem("strattigo_onboarding_complete");
    if (done) return;

    try {
      const courses = await getCourses();
      if (courses.length > 0) {
        localStorage.setItem("strattigo_onboarding_complete", "true");
        return;
      }
    } catch {
      // non-critical
    }
    setShowOnboarding(true);
  }

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    localStorage.setItem("strattigo_onboarding_complete", "true");
  }

  if (confirmTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-page text-ink">
        <div className="max-w-md w-full px-7 py-8 text-center rounded-xl border border-rule bg-sheet shadow-lg">
          <span className="font-display font-semibold text-xl tracking-[0.1em] text-accent-deep">
            STRATTIGO
          </span>
          <p className="mt-5 text-ui leading-relaxed text-ink-soft font-read">
            We&apos;re confirming your payment — this can take a minute. Refresh shortly or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!subChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-page text-ink">
        <span
          className="font-display font-semibold text-2xl tracking-[0.1em] text-accent-deep"
          style={{ animation: "fadeIn 0.5s ease-out both" }}
        >
          STRATTIGO
        </span>
        {/* Loading bar */}
        <div className="w-[120px] h-[2px] rounded-[1px] overflow-hidden bg-sunk">
          <div className="animate-shimmer-accent h-full rounded-[1px]" />
        </div>
        {confirmingCheckout && (
          <p className="text-ui text-ink-soft" style={{ animation: "fadeIn 0.5s ease-out both" }}>
            Confirming your subscription…
          </p>
        )}
      </div>
    );
  }

  // Workspace routes bring their own full-bleed cream frame — render them
  // without the global header (the gate above has already run).
  if (isWorkspaceReader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink">
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      <GlobalNav />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 pb-20">
        {children}
      </main>
    </div>
  );
}
