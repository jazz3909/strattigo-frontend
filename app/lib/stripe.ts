import { apiGet, apiPost } from "./api";

// The only sellable Stripe price ($4.99/month promotional pricing since
// 2026-07-22; replaced the $7.99 price, which stays active in Stripe for
// existing subscriptions). Annual was removed for beta — its ID was a
// never-configured placeholder ("price_annual") that failed checkout with
// resource_missing whenever selected. Must stay in sync with
// MONTHLY_PRICE_ID in the backend's stripe_routes.py (its allowlist rejects
// anything else).
export const MONTHLY_PRICE_ID = "price_1Tw8iBGm99mbwFrzan191GJt";

// Checkout and the billing portal both run through server-generated hosted
// URLs (see checkoutSession / openBillingPortal), so the browser never needs
// Stripe.js. The @stripe/stripe-js SDK was dropped from the client bundle to
// keep it off every page that only reads subscription status (dashboard,
// login, signup). Reintroduce loadStripe here only if a surface adopts Stripe
// Elements / on-page card collection.

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
