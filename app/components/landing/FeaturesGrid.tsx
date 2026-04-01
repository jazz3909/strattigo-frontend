"use client";

import { useRef } from "react";
import { useInView } from "../../hooks/useInView";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: "AI Study Guides",
    description:
      "Upload your notes, slides, or textbooks and get a beautifully structured study guide in seconds — with key concepts, definitions, and explanations.",
    color: "text-violet-600",
    bgColor: "from-violet-500 to-purple-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "Practice Quizzes",
    description:
      "Test your knowledge with AI-generated multiple choice questions tailored exactly to your course materials. Get instant feedback on every answer.",
    color: "text-blue-600",
    bgColor: "from-blue-500 to-indigo-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: "Chat with Materials",
    description:
      "Ask any question about your readings and get instant, context-aware answers backed by your uploaded documents.",
    color: "text-emerald-600",
    bgColor: "from-emerald-500 to-teal-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "Smart Study Plans",
    description:
      "Tell us your exam date. Strattigo builds a personalized, day-by-day study schedule optimized for your course content.",
    color: "text-pink-600",
    bgColor: "from-pink-500 to-rose-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    title: "Canvas Integration",
    description:
      "Connect your Canvas LMS account and automatically import course materials — no manual uploading required.",
    color: "text-amber-600",
    bgColor: "from-amber-500 to-orange-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: "Instant Results",
    description:
      "No waiting. Get your study guide, quiz, or plan generated in seconds. Works with PDFs, PowerPoints, Word docs, and plain text.",
    color: "text-cyan-600",
    bgColor: "from-cyan-500 to-blue-600",
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`group bg-white rounded-2xl border border-slate-100 p-6 cursor-default
        transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:border-violet-100
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.bgColor} shadow-sm mb-5`}>
        {feature.icon}
      </div>

      {/* Content */}
      <h3 className="text-base font-bold text-slate-900 mb-2.5 group-hover:text-violet-700 transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
    </div>
  );
}

export function FeaturesGrid() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section id="features" className="py-24 px-4 sm:px-6 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            Everything you need
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
            Your complete AI study toolkit
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Strattigo turns your course materials into powerful study tools with a single click.
            Upload once, study smarter for the whole semester.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
