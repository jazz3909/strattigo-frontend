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
