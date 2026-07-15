"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../lib/api";
import {
  getSubscriptionStatus,
  openBillingPortal,
  SubscriptionStatus,
} from "../../lib/stripe";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "../../providers/ToastProvider";

export default function BillingSettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    getSubscriptionStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        // Leave status null — the page renders the "no subscription" state,
        // which links to pricing rather than blocking the user.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      await openBillingPortal();
      // openBillingPortal navigates away on success; only errors reach here.
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Couldn't open the billing portal.",
        "error"
      );
      setPortalLoading(false);
    }
  }

  const isPro =
    status?.is_pro === true || status?.plan === "pro" || status?.plan === "annual";

  return (
    <div className="mx-auto w-full max-w-[620px]">
      <h1 className="font-display text-[28px] leading-[1.1] font-semibold tracking-[-0.012em] text-ink">
        Billing
      </h1>
      <p className="mt-1.5 mb-7 font-read text-read-s text-ink-soft">
        Your subscription and payment details.
      </p>

      {loading ? (
        <Card>
          <div className="skeleton-sheen mb-3 h-5 w-40 rounded bg-sunk" />
          <div className="skeleton-sheen mb-6 h-4 w-64 rounded bg-sunk" />
          <div className="skeleton-sheen h-9 w-44 rounded-sm bg-sunk" />
        </Card>
      ) : isPro ? (
        <Card>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="font-display text-[17px] font-medium text-ink">
              Strattigo Pro
            </h2>
            <Pill variant="success">
              <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
              Active
            </Pill>
          </div>
          {status?.expires_at && (
            <p className="mb-4 font-read text-read-s text-ink-soft">
              Current period ends{" "}
              {new Date(status.expires_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </p>
          )}
          <p className="mb-5 font-read text-read-s text-ink-soft">
            Cancel your subscription, update your payment method, or view
            invoices through Stripe&apos;s secure billing portal.
          </p>
          <Button
            variant="primary"
            onClick={handleManageSubscription}
            disabled={portalLoading}
          >
            {portalLoading ? "Opening…" : "Manage subscription"}
          </Button>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-2 font-display text-[17px] font-medium text-ink">
            No active subscription
          </h2>
          <p className="mb-5 font-read text-read-s text-ink-soft">
            You don&apos;t have an active plan on this account.
          </p>
          <Link href="/pricing" className={buttonVariants({ variant: "primary" })}>
            View plans
          </Link>
        </Card>
      )}
    </div>
  );
}
