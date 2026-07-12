import { loadStripe } from "@stripe/stripe-js";
import { apiGet, apiPost } from "./api";

// The only live Stripe price ($7.99/month, verified active 2026-07-12).
// Replaced the leftover $2.00 beta price. Annual was removed for beta — its
// ID was a never-configured placeholder ("price_annual") that failed
// checkout with resource_missing whenever selected. Must stay in sync with
// MONTHLY_PRICE_ID in the backend's stripe_routes.py (its allowlist rejects
// anything else).
export const MONTHLY_PRICE_ID = "price_1TsD19Gm99mbwFrzu0uWwOLK";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

interface CheckoutSessionResponse {
  url: string;
}

export async function checkoutSession(
  priceId: string,
  couponCode?: string
): Promise<void> {
  const body: Record<string, string> = { price_id: priceId };
  if (couponCode) body.coupon_code = couponCode;

  const { url } = await apiPost<CheckoutSessionResponse>(
    "/stripe/create-checkout-session",
    body
  );

  if (!url) throw new Error("No checkout URL returned from server");
  window.location.href = url;
}

interface PortalSessionResponse {
  url: string;
}

// Stripe's hosted Customer Billing Portal: cancel subscription, update
// payment method, view invoices. The backend resolves the caller's Stripe
// customer and returns a single-use portal URL.
export async function openBillingPortal(): Promise<void> {
  const { url } = await apiPost<PortalSessionResponse>(
    "/stripe/create-portal-session",
    {}
  );

  if (!url) throw new Error("No portal URL returned from server");
  window.location.href = url;
}

// Matches the backend payload exactly: GET /stripe/subscription-status returns
// {is_pro, plan, expires_at}. `is_pro` is the canonical paid signal — prefer it
// over string-matching `plan` so a paid account is never misread.
export interface SubscriptionStatus {
  is_pro: boolean;
  plan: "free" | "pro" | "annual";
  expires_at: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  // `cache: "no-store"` guarantees every call is a real network round-trip. The
  // post-checkout grace-period poll re-requests this same URL every 2s and must
  // observe the webhook's write the instant it lands — never a cached "free"
  // served from the first attempt.
  return apiGet<SubscriptionStatus>("/stripe/subscription-status", true, {
    cache: "no-store",
  });
}

export { getStripe };
