"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, setToken, setUser } from "../lib/api";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useToast } from "../providers/ToastProvider";

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

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);

  const strengthColors = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
  };

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
      const data = await signup(email, password);
      setToken(data.access_token);
      setUser(data.user_id, data.email);
      document.cookie = `strattigo_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
      addToast("Account created! Welcome to Strattigo.", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setFieldErrors({ email: msg });
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 gradient-brand-animated" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl orb-2" />

        <div className="relative z-10 max-w-sm text-center text-white">
          <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-xl font-bold">Strattigo</span>
          </Link>

          <h2 className="text-3xl font-extrabold mb-4 leading-tight">
            Start studying smarter<br />today
          </h2>
          <p className="text-white/70 leading-relaxed mb-10">
            Free forever. No credit card needed. Join hundreds of students already using Strattigo to ace their exams.
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-4 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-6">
            <div className="flex -space-x-2">
              {["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-emerald-400"].map((color, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold`}>
                  {["A", "B", "C", "D"][i]}
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">500+ students</p>
              <p className="text-xs text-white/60">already studying smarter</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 text-white/50 text-xs">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            No credit card required
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 bg-white overflow-y-auto">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="text-xl font-bold gradient-text">Strattigo</span>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">Create your account</h1>
            <p className="text-slate-500 text-sm">Free forever — no credit card required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              error={fieldErrors.email}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />

            {/* Password with strength indicator */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full pl-10 pr-12 py-3 text-sm border rounded-xl outline-none transition-all duration-150 ${
                    fieldErrors.password
                      ? "border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-400/40"
                      : "border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Strength indicator */}
              {password && (
                <div className="space-y-1.5 mt-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strengthColors[strength.color]}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.color === "red" ? "text-red-600" :
                    strength.color === "amber" ? "text-amber-600" :
                    strength.color === "blue" ? "text-blue-600" : "text-emerald-600"
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Confirm password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl outline-none transition-all duration-150 ${
                    fieldErrors.confirm
                      ? "border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-400/40"
                      : confirm && confirm === password
                      ? "border-emerald-400 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-400/30"
                      : "border-slate-200 bg-white focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  }`}
                />
                {confirm && confirm === password && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
              </div>
              {fieldErrors.confirm && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.confirm}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Create account
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center mt-8 text-xs text-slate-400">
            By creating an account, you agree to our{" "}
            <a href="#" className="underline hover:text-slate-600">Terms</a> and{" "}
            <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
