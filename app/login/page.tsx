"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, persistSession } from "../lib/api";
import { getSubscriptionStatus } from "../lib/stripe";
import { useToast } from "../providers/ToastProvider";
import { AuthShell } from "@/components/public/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
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
      {error && <p className="mt-1.5 font-sans text-ui-s text-error">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      const data = await login(email, password);
      persistSession(data);
      addToast("Welcome back! Redirecting…", "success");
      const { plan } = await getSubscriptionStatus();
      router.push(plan === "pro" || plan === "annual" ? "/dashboard" : "/pricing");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setFieldErrors({ password: msg });
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up right where you left off."
      alt={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent-deep">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className={shake ? "animate-shake" : undefined}>
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
            autoComplete="current-password"
            placeholder="Your password"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="mt-5 w-full rounded-full bg-ink text-page hover:bg-ink-soft"
          disabled={loading}
        >
          {loading && <Spinner />}
          Log in
        </Button>

        <p className="mt-4 text-center font-sans text-[12.5px] leading-[1.45] text-ink-faint">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-medium text-accent-deep">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-accent-deep">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
