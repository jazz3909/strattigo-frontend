"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../lib/api";
import {
  getSubscriptionStatus,
  isBetaProvisionedSub,
  openBillingPortal,
  SubscriptionStatus,
} from "../../lib/stripe";
import { BETA_MODE } from "@/components/public/plans";
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
  // Beta-provisioned Pro (2099 sentinel) has no Stripe customer behind it —
  // the portal button would error, and "period ends 2099" would read as a bug.
  const isBetaAccess = status !== null && isBetaProvisionedSub(status);

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
      ) : isPro && isBetaAccess ? (
        <Card>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="font-display text-[17px] font-medium text-ink">
              Strattigo Pro
            </h2>
            <Pill variant="success">
              <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
              Beta access
            </Pill>
          </div>
          <p className="mb-5 font-read text-read-s text-ink-soft">
            Full Pro access is on us for the entire beta — no subscription,
            nothing to bill, nothing to cancel. Paid plans return after the
            beta.
          </p>
          <Link href="/pricing" className={buttonVariants({ variant: "secondary" })}>
            See beta details
          </Link>
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
      ) : BETA_MODE ? (
        // No subscription row during beta (legacy pre-beta account, or the
        // status call failed): nothing to sell — point at the beta card.
        <Card>
          <h2 className="mb-2 font-display text-[17px] font-medium text-ink">
            Strattigo is free during the beta
          </h2>
          <p className="mb-5 font-read text-read-s text-ink-soft">
            There&apos;s nothing to subscribe to right now — the whole platform
            is free while the beta runs. Paid plans return after the beta.
          </p>
          <Link href="/pricing" className={buttonVariants({ variant: "secondary" })}>
            See beta details
          </Link>
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
