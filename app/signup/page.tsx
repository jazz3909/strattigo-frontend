"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, login, persistSession } from "../lib/api";
import { getSubscriptionStatus } from "../lib/stripe";
import { useToast } from "../providers/ToastProvider";
import { AuthShell } from "@/components/public/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getPasswordStrength(pw: string): { score: number; label: string; color: "red" | "amber" | "blue" | "green" } {
  if (!pw) return { score: 0, label: "", color: "red" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 20, label: "Weak", color: "red" };
  if (score === 2) return { score: 40, label: "Fair", color: "amber" };
  if (score === 3) return { score: 65, label: "Good", color: "blue" };
  return { score: 100, label: "Strong", color: "green" };
}

/* Weak→1 / Fair→2 / Good→3 / Strong→4 filled segments, label tinted to match. */
const strengthStyles: Record<
  "red" | "amber" | "blue" | "green",
  { segments: number; bar: string; text: string }
> = {
  red: { segments: 1, bar: "bg-error", text: "text-error" },
  amber: { segments: 2, bar: "bg-caution", text: "text-caution" },
  blue: { segments: 3, bar: "bg-accent", text: "text-accent" },
  green: { segments: 4, bar: "bg-success", text: "text-success" },
};

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  error,
  autoComplete,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  /** Rendered between the field and the error line (strength meter). */
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-sans text-ui-s font-medium text-ink-soft">{label}</span>
      </div>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={error ? "border-error pr-12" : "pr-12"}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleShow}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer font-sans text-ui-s text-ink-faint"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {children}
      {error && <p className="mt-1.5 font-sans text-ui-s text-error">{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);
  const strengthStyle = strengthStyles[strength.color];
  const confirmMatches = Boolean(confirm) && confirm === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters";
    if (password && confirm !== password) errors.confirm = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await signup(email, password);
      const data = await login(email, password);
      persistSession(data);
      const { plan } = await getSubscriptionStatus();
      router.push(plan === "pro" || plan === "annual" ? "/dashboard" : "/pricing");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setFieldErrors({ email: msg });
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. No card required."
      alt={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-deep">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-[18px]">
          <div>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              aria-invalid={fieldErrors.email ? true : undefined}
              className={fieldErrors.email ? "border-error" : undefined}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 font-sans text-ui-s text-error">{fieldErrors.email}</p>
            )}
          </div>

          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            show={showPassword}
            onToggleShow={() => setShowPassword((s) => !s)}
            error={fieldErrors.password}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          >
            {password && (
              <>
                <div className="mt-2 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < strengthStyle.segments ? strengthStyle.bar : "bg-sunk"
                      }`}
                    />
                  ))}
                </div>
                <p className={`mt-1.5 font-sans text-[11.5px] font-medium ${strengthStyle.text}`}>
                  {strength.label} password
                </p>
              </>
            )}
          </PasswordField>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="font-sans text-ui-s font-medium text-ink-soft">
                Confirm password
              </span>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                aria-invalid={fieldErrors.confirm ? true : undefined}
                className={
                  fieldErrors.confirm
                    ? "border-error pr-12"
                    : confirmMatches
                      ? "border-success pr-12"
                      : "pr-12"
                }
              />
              {confirmMatches && (
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-success">
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}
            </div>
            {fieldErrors.confirm && (
              <p className="mt-1.5 font-sans text-ui-s text-error">{fieldErrors.confirm}</p>
            )}
          </div>
        </div>

        <p className="my-5 font-sans text-[12.5px] leading-[1.45] text-ink-soft">
          By creating an account, you agree to Strattigo&rsquo;s{" "}
          <Link href="/terms" className="font-medium text-accent-deep">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-accent-deep">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading && <Spinner />}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
