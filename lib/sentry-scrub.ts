/**
 * Privacy scrubbing for everything Sentry sends — student data must never
 * leave the browser/server in an error report. Mirrors the backend scrubber
 * (studyplatform api/main.py): secret-shaped strings are masked wherever they
 * appear, sensitive-named fields are masked wholesale, request bodies /
 * cookies / user identity are dropped, and if scrubbing itself throws the
 * event is dropped entirely — losing a report beats leaking data.
 */

// Field names whose VALUES must never reach Sentry (matched as substrings,
// case-insensitive) — covers strattigo_token, access_token, refresh_token,
// Authorization headers, cookies, admin keys.
const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "token",
  "password",
  "secret",
  "api_key",
  "apikey",
  "x-admin-key",
  "dsn",
  "credential",
  "session",
];

// Secret-shaped strings: Stripe secret/restricted/webhook keys, Anthropic
// keys, Voyage keys, JWTs (the Supabase auth tokens), any Bearer credential.
const SECRET_RE =
  /\b(?:sk_live_|sk_test_|rk_live_|rk_test_|whsec_)[A-Za-z0-9]+|\bsk-ant-[A-Za-z0-9_-]{10,}|\bpa-[A-Za-z0-9_-]{16,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+|Bearer\s+\S+/g;

export function scrubDeep(value: unknown): unknown {
  if (typeof value === "string") return value.replace(SECRET_RE, "[Scrubbed]");
  if (Array.isArray(value)) return value.map(scrubDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))
        ? "[Scrubbed]"
        : scrubDeep(v);
    }
    return out;
  }
  return value;
}

/**
 * beforeSend / beforeSendTransaction hook. Returns null (drops the event)
 * if scrubbing fails for any reason.
 */
export function scrubEvent<T>(event: T): T | null {
  try {
    const e = event as Record<string, unknown>;
    const request = e.request as Record<string, unknown> | undefined;
    if (request) {
      delete request.data; // request bodies: material/chat/generation content
      delete request.cookies;
    }
    delete e.user; // no user identity attached, ever
    return scrubDeep(e) as T;
  } catch {
    return null;
  }
}
