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
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
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
    <div className="max-w-2xl mx-auto">
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Billing
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Your subscription and payment details.
      </p>

      {loading ? (
        <Card>
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-4 w-64 mb-6" />
          <Skeleton className="h-9 w-44" />
        </Card>
      ) : isPro ? (
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Strattigo Pro
            </h2>
            <Badge variant="green" dot>
              Active
            </Badge>
          </div>
          {status?.expires_at && (
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Current period ends{" "}
              {new Date(status.expires_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </p>
          )}
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Cancel your subscription, update your payment method, or view
            invoices through Stripe&apos;s secure billing portal.
          </p>
          <Button
            variant="secondary"
            onClick={handleManageSubscription}
            loading={portalLoading}
          >
            Manage subscription
          </Button>
        </Card>
      ) : (
        <Card>
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No active subscription
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            You don&apos;t have an active plan on this account.
          </p>
          <Link href="/pricing">
            <Button variant="primary">View plans</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
