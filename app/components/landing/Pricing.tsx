"use client";

import Link from "next/link";
import { useInView } from "../../hooks/useInView";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Strattigo",
    cta: "Get started free",
    ctaHref: "/signup",
    primary: false,
    features: [
      "Up to 3 courses",
      "10 AI generations / month",
      "Study guides & quizzes",
      "AI chat (50 messages/mo)",
      "PDF & document upload",
    ],
    missing: ["Unlimited courses", "Canvas LMS sync", "Priority generation"],
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For serious students who want it all",
    cta: "Start Pro free",
    ctaHref: "/signup",
    primary: true,
    badge: "Most popular",
    features: [
      "Unlimited courses",
      "Unlimited AI generations",
      "Study guides, quizzes & plans",
      "Unlimited AI chat",
      "Canvas LMS integration",
      "Priority AI generation",
      "Export to PDF",
    ],
    missing: [],
  },
];

export function Pricing() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6" style={{ background: "var(--surface)" }}>
      <div className="max-w-4xl mx-auto">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-14 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-5"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
          >
            Simple pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
            Start free, upgrade when ready
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            No credit card required to get started. Upgrade for unlimited access anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{
                background: plan.primary ? "var(--accent)" : "var(--surface-2)",
                border: plan.primary ? "none" : "1px solid var(--border)",
                boxShadow: plan.primary ? "0 20px 40px -8px rgba(255,176,117,0.4)" : undefined,
                transitionDelay: `${i * 150}ms`,
              }}
            >
              {plan.badge && (
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4"
                  style={{ background: "rgba(0,0,0,0.15)", color: "#0a0a0f" }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {plan.badge}
                </div>
              )}

              <h3 className="text-lg font-bold mb-1" style={{ color: plan.primary ? "#0a0a0f" : "var(--text-primary)" }}>
                {plan.name}
              </h3>
              <p className="text-sm mb-5" style={{ color: plan.primary ? "rgba(10,10,15,0.7)" : "var(--text-secondary)" }}>
                {plan.description}
              </p>

              <div className="flex items-end gap-1.5 mb-6">
                <span className="text-4xl font-extrabold" style={{ color: plan.primary ? "#0a0a0f" : "var(--text-primary)" }}>
                  {plan.price}
                </span>
                <span className="text-sm pb-1" style={{ color: plan.primary ? "rgba(10,10,15,0.6)" : "var(--text-tertiary)" }}>
                  /{plan.period}
                </span>
              </div>

              <Link
                href={plan.ctaHref}
                className="btn-press flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm mb-7 transition-all"
                style={
                  plan.primary
                    ? { background: "rgba(0,0,0,0.15)", color: "#0a0a0f" }
                    : { background: "var(--accent)", color: "#0a0a0f" }
                }
              >
                {plan.cta}
              </Link>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                      style={{ color: plan.primary ? "rgba(10,10,15,0.8)" : "var(--success)" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span style={{ color: plan.primary ? "rgba(10,10,15,0.9)" : "var(--text-primary)" }}>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm opacity-40">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: "var(--text-tertiary)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
