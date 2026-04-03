import { loadStripe } from "@stripe/stripe-js";
import { apiGet, apiPost } from "./api";

export const MONTHLY_PRICE_ID = "[200~price_1THvxxGm99mbwFrz8JgalyyA";
export const ANNUAL_PRICE_ID = "price_annual";

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

export interface SubscriptionStatus {
  plan: "free" | "pro" | "annual";
  status: "active" | "canceled" | "past_due" | "trialing" | null;
  current_period_end: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiGet<SubscriptionStatus>("/stripe/subscription-status");
}

export { getStripe };
