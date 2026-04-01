"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Study Guides", "Practice Quizzes", "Study Plans", "AI Chat"];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Animated orb blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="orb-1 absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-400/20 to-purple-300/10 blur-3xl" />
        <div className="orb-2 absolute bottom-[10%] right-[8%] w-[450px] h-[450px] rounded-full bg-gradient-to-tl from-blue-400/20 to-cyan-300/10 blur-3xl" />
        <div className="orb-3 absolute top-[40%] right-[25%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-pink-300/15 to-violet-200/10 blur-3xl" />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid-purple opacity-40" />
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-violet-200 text-violet-700 text-sm font-semibold px-5 py-2.5 rounded-full mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          Powered by AI — Built for students
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up animation-delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-6">
          Generate{" "}
          <span className="relative inline-block">
            <span
              className={`gradient-text transition-all duration-300 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
              style={{ display: "inline-block", transition: "opacity 0.3s, transform 0.3s" }}
            >
              {ROTATING_WORDS[wordIndex]}
            </span>
          </span>
          <br />
          from your notes
        </h1>

        {/* Subheading */}
        <p className="animate-fade-in-up animation-delay-200 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Upload your PDFs, slides, and documents. Strattigo&apos;s AI instantly creates comprehensive
          study guides, practice quizzes, study plans, and a chat assistant — all tailored to your
          course.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row gap-4 items-center justify-center mb-16">
          <Link
            href="/signup"
            className="btn-gradient btn-press inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            style={{ boxShadow: "var(--shadow-brand)" }}
          >
            Start studying for free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="btn-press inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white/90 border border-slate-200 rounded-2xl hover:bg-white hover:border-slate-300 shadow-sm hover:shadow-md transition-all"
          >
            Log in
          </Link>
        </div>

        {/* Social proof */}
        <div className="animate-fade-in-up animation-delay-400 flex items-center justify-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-pink-500"].map((color, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}>
                  {["A", "B", "C", "D"][i]}
                </div>
              ))}
            </div>
            <span><strong className="text-slate-600">500+</strong> students studying smarter</span>
          </div>
          <span className="hidden sm:inline w-px h-4 bg-slate-200" />
          <div className="hidden sm:flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="font-medium text-slate-600">4.9/5</span>
          </div>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="animate-fade-in-up animation-delay-500 relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 mt-12 mb-8">
        <div
          className="relative rounded-2xl overflow-hidden border border-slate-200/80"
          style={{
            boxShadow: "0 40px 80px -20px rgba(124, 58, 237, 0.2), 0 20px 40px -10px rgba(0,0,0,0.1)",
            transform: "perspective(1200px) rotateX(4deg)",
          }}
        >
          {/* Browser chrome */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white/80 rounded-lg px-4 py-1.5 text-xs text-slate-400 flex items-center gap-2 min-w-0 max-w-xs w-full">
                <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                strattigo.app/dashboard
              </div>
            </div>
          </div>

          {/* Mock dashboard content */}
          <div className="bg-slate-50 p-4 sm:p-6" style={{ minHeight: 280 }}>
            {/* Mock nav */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between mb-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg gradient-brand" />
                <div className="h-3 w-20 rounded animate-shimmer" />
                <div className="hidden sm:flex gap-2">
                  <div className="h-3 w-12 rounded animate-shimmer" />
                  <div className="h-3 w-12 rounded animate-shimmer" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-3 w-24 rounded animate-shimmer" />
                <div className="h-3 w-12 rounded animate-shimmer" />
              </div>
            </div>

            {/* Mock greeting */}
            <div className="mb-4">
              <div className="h-6 w-48 rounded-lg animate-shimmer mb-2" />
              <div className="h-3 w-32 rounded animate-shimmer" />
            </div>

            {/* Mock stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Courses", value: "6", color: "from-violet-500 to-purple-600" },
                { label: "Materials", value: "24", color: "from-blue-500 to-indigo-600" },
                { label: "AI Generations", value: "47", color: "from-emerald-500 to-teal-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.color} mb-2`} />
                  <div className="text-lg font-bold text-slate-800">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Mock course cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: "Organic Chemistry", color: "from-violet-500 to-purple-600", initial: "O", materials: 5 },
                { name: "Calculus II", color: "from-blue-500 to-indigo-600", initial: "C", materials: 8 },
                { name: "Biology 101", color: "from-emerald-500 to-teal-600", initial: "B", materials: 3 },
              ].map((course) => (
                <div key={course.name} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-white font-bold text-sm mb-3`}>
                    {course.initial}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">{course.name}</p>
                  <p className="text-xs text-slate-400">{course.materials} materials</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection/glow under mockup */}
        <div className="absolute -bottom-6 left-1/4 right-1/4 h-12 bg-violet-500/20 blur-2xl rounded-full" />
      </div>
    </section>
  );
}
