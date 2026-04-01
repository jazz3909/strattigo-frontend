"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.5 });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const duration = 1500;
    const start = Date.now();
    const update = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [inView, target]);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { label: "Students studying smarter", value: 500, suffix: "+" },
  { label: "Study guides generated", value: 12000, suffix: "+" },
  { label: "Quizzes completed", value: 47000, suffix: "+" },
  { label: "Average grade improvement", value: 1.2, suffix: " GPA pts" },
];

const testimonials = [
  {
    text: "Strattigo cut my study time in half. The AI quiz generator is insanely good at knowing exactly what's important.",
    author: "Maria T.",
    role: "Biology major, UF",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    text: "I used to spend hours making study guides. Now I upload my notes and have one in minutes. Game changer.",
    author: "Jake R.",
    role: "Engineering student, FSU",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    text: "The chat feature is like having a tutor available 24/7 who has read all my course materials.",
    author: "Sofia L.",
    role: "Pre-med, UCF",
    gradient: "from-emerald-500 to-teal-600",
  },
];

export function SocialProof() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-semibold px-4 py-2 rounded-full mb-5 border border-white/20">
            Trusted by students
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Join 500+ Florida students
          </h2>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Students across Florida are using Strattigo to study smarter, not harder.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className={`p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${400 + i * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-white/80 leading-relaxed mb-5 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.author[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
