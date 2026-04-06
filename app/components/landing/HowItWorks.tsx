"use client";

import { useInView } from "../../hooks/useInView";

const steps = [
  {
    number: "01",
    title: "Add your courses",
    description:
      "Create a course in Strattigo for each class you're studying. Give it a name and description to get started.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    color: "from-violet-500 to-purple-600",
  },
  {
    number: "02",
    title: "Upload your materials",
    description:
      "Drag and drop your PDFs, PowerPoints, Word documents, or text files. Or connect Canvas to import automatically.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    color: "from-blue-500 to-indigo-600",
  },
  {
    number: "03",
    title: "Generate & study",
    description:
      "Hit generate on Study Guide, Quiz, or Study Plan. Chat with your AI tutor. Ace your exams.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    color: "from-emerald-500 to-teal-600",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6" style={{ background: "var(--surface)" }}>
      <div className="max-w-5xl mx-auto">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-5"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
          >
            Simple as 1-2-3
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
            Study smarter in 3 steps
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            From setup to studying in under two minutes. No learning curve required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px" style={{ background: "var(--border)" }} />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative text-center"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Number circle */}
                <div className={`relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-6 shadow-lg`}>
                  {step.icon}
                </div>

                {/* Step number badge */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-x-4 -translate-y-1 text-xs font-bold" style={{ color: "var(--text-tertiary)" }}>
                  {step.number}
                </div>

                <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
