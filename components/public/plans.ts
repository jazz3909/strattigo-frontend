/**
 * Single source of plan copy for every public pricing surface
 * (/pricing cards + the landing pricing section).
 *
 * FREE copy mirrors the backend's real quotas (api/config/plan_limits.py:
 * 10/15/50 + 20 materials; uploads capped at 50MB per file). PRO copy
 * deliberately uses "Unlimited" marketing wording (owner's call, 2026-07-12)
 * even though the backend enforces generous caps (200/300/1000).
 */

export const PRICE_MONTHLY = "$4.99"

/**
 * BETA MODE — flip to false when beta ends and the paid plans return.
 * While true: /pricing and the landing pricing copy show the single BETA
 * card (Free/Pro cards are hidden, not deleted), signups/logins never route
 * through /pricing, the dashboard's subscription gate admits everyone, and
 * no surface routes to Stripe checkout. The backend auto-provisions Pro on
 * signup (api/routes/auth.py, same marker comment).
 * Typed `boolean` (not the literal `true`) so the dormant non-beta branches
 * stay type-checked instead of being narrowed into dead code.
 */
export const BETA_MODE: boolean = true

export const BETA_FEATURES = [
  "Unlimited courses, materials & collections",
  "Unlimited study guides, quizzes & tutor chat",
  "Full Pro access — every feature unlocked",
  "Help shape the product — feedback button is on your dashboard",
]

export const BETA_FOOTNOTE =
  "Free unlimited access for all beta users. No card, no catch — just tell us what to improve."

/** The one-line price blurb under the landing CTAs. */
export const LANDING_PRICE_LINE = BETA_MODE
  ? "Free during beta · full access · no card required"
  : `Free to start · ${PRICE_MONTHLY}/mo for Pro · no card required`

export const FREE_FEATURES = [
  "Up to 3 courses",
  "10 study guides / month",
  "15 quizzes / month",
  "AI chat (50 messages / month)",
  "Store up to 20 materials",
  "PDF & document uploads up to 50MB",
]

export const PRO_FEATURES = [
  "Unlimited courses",
  "Unlimited AI study guides",
  "Unlimited quizzes",
  "Unlimited AI chat",
  "Study plans & flashcards",
  "Store up to 500 materials",
  "Canvas LMS integration",
  "Priority AI generation",
]
