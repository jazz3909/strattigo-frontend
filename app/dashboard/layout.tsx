"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getEmail, getCourses } from "../lib/api";
import { getSubscriptionStatus } from "../lib/stripe";
import { useEffect, useState } from "react";
import { Avatar } from "../components/ui/Avatar";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { OnboardingModal } from "../components/OnboardingModal";

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Courses",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: "/settings/canvas",
    label: "Canvas",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    // Dashboard is subscription-gated (see the gate() effect below), so this
    // link is effectively Pro-only — exactly who can manage/cancel a plan.
    href: "/settings/billing",
    label: "Billing",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Course detail pages (/dashboard/<courseId>) render full-bleed; every other dashboard page keeps
  // the centered max-w-7xl treatment. Matches a single non-empty segment after /dashboard/ only —
  // so /dashboard itself and any deeper/reserved routes are unaffected.
  const isCourseDetail = /^\/dashboard\/[^/]+$/.test(pathname);
  // The study-guide reading view and the quiz surface (ui-rebuild) are their
  // own full-bleed cream workspace frames (rail + top bar); they replace the
  // dark global chrome rather than nesting under it. The subscription gate
  // below still runs for them.
  const isWorkspaceReader =
    /^\/dashboard\/[^/]+\/(?:guide|quiz)\/[^/]+$/.test(pathname) ||
    /^\/dashboard\/[^/]+\/materials$/.test(pathname);
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [subChecked, setSubChecked] = useState(false);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const e = getEmail();
    if (e) setEmail(e);
  }, []);

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleLogout() {
    clearToken();
    document.cookie = "strattigo_token=; path=/; max-age=0";
    window.location.href = "/login";
  }

  if (confirmTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "transparent" }}>
        <div
          className="max-w-md w-full px-7 py-8 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "var(--accent)",
            }}
          >
            STRATTIGO
          </span>
          <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            We&apos;re confirming your payment — this can take a minute. Refresh shortly or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!subChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "transparent" }}>
        <span
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "var(--accent)",
            animation: "fadeIn 0.5s ease-out both",
          }}
        >
          STRATTIGO
        </span>
        {/* Loading bar */}
        <div style={{ width: "120px", height: "2px", background: "var(--surface-3)", borderRadius: "1px", overflow: "hidden" }}>
          <div
            className="animate-shimmer"
            style={{
              height: "100%",
              background: "var(--accent)",
              borderRadius: "1px",
            }}
          />
        </div>
        {confirmingCheckout && (
          <p className="text-sm" style={{ color: "var(--text-secondary)", animation: "fadeIn 0.5s ease-out both" }}>
            Confirming your subscription…
          </p>
        )}
      </div>
    );
  }

  // The reading view brings its own full-bleed cream frame — render it without
  // the dark global header / mobile nav (the gate above has already run).
  if (isWorkspaceReader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "transparent" }}>
      {/* Onboarding modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Top nav */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200`}
        style={{
          background: "rgba(10, 14, 24, 0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo + nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-primary)", fontSize: "1rem" }}>STRATTIGO</span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative group"
                    style={isActive
                      ? { background: "var(--accent-dim)", color: "var(--accent)" }
                      : { color: "var(--text-secondary)" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-2)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {email && (
              <div className="hidden sm:flex items-center gap-2.5 ml-1">
                <div
                  style={{ transition: "filter 200ms ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "drop-shadow(0 0 6px rgba(255,176,117,0.5))"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = "none"; }}
                >
                  <Avatar name={email} size="sm" />
                </div>
                <span className="truncate max-w-[140px]" style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
                  {email}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium transition-all px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t shadow-lg" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-around h-16 max-w-sm mx-auto px-4">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-xs font-medium transition-all min-h-[44px] min-w-[44px] justify-center"
                style={{ color: isActive ? "var(--accent)" : "var(--text-tertiary)" }}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-5 py-2 text-xs font-medium transition-colors min-h-[44px] min-w-[44px] justify-center cursor-pointer"
            style={{ color: "var(--text-tertiary)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Log out
          </button>
        </div>
      </div>

      <main
        className={
          isCourseDetail
            ? "flex-1 w-full"
            : "flex-1 px-4 sm:px-6 py-8 pb-24 sm:pb-8 max-w-7xl w-full mx-auto page-enter"
        }
      >
        {children}
      </main>
    </div>
  );
}
