"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Brand } from "@/components/public/brand";
import { PublicFooter } from "@/components/public/public-footer";
import {
  FREE_FEATURES,
  PRO_FEATURES,
  PRICE_MONTHLY,
} from "@/components/public/plans";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getToken } from "./lib/api";

/**
 * Landing page — ported from landing.html ("energetic version").
 *
 * Landing-only palette: the landing page deliberately uses fuller, livelier
 * fields than the committed subject-* tokens (mock comment: "landing gets
 * fuller, livelier fields (still in-family)"). Scoped here as CSS vars on the
 * page root on purpose — do NOT promote these to globals.css.
 */
const landingVars = {
  "--dusk": "#5E7185",
  "--dusk-d": "#42536A",
  "--dusk-f": "#DDE4EC",
  "--sage": "#6E7F5E",
  "--sage-d": "#54634A",
  "--sage-f": "#E4EAD8",
  "--ochre": "#B5842F",
  "--ochre-d": "#8A6320",
  "--ochre-f": "#F4E7CB",
  "--clay": "#A85A45",
  "--clay-d": "#864636",
  "--clay-f": "#F3DDD4",
  "--plum": "#715C7E",
  "--plum-f": "#E9E2EE",
  "--ok": "#4E7A57",
} as React.CSSProperties;

/* Mock .btn-primary carries a dusk-tinted glow on top of the shared button. */
const primaryShadow =
  "shadow-[0_6px_16px_rgba(94,113,133,.28)] hover:shadow-[0_8px_22px_rgba(94,113,133,.34)]";

const container = "mx-auto w-full max-w-[1080px] px-6 sm:px-8";

const STEPS = [
  {
    card: "bg-[var(--sage-f)]",
    num: "bg-[var(--sage)]",
    title: "text-[var(--sage-d)]",
    heading: "Upload your materials",
    body: "Drop in lecture slides, PDFs, and notes — then organize them into collections by unit or topic, as deep as you like.",
  },
  {
    card: "bg-[var(--dusk-f)]",
    num: "bg-[var(--dusk)]",
    title: "text-[var(--dusk-d)]",
    heading: "Choose what to study",
    body: "Point Strattigo at a whole course or one specific folder. Everything it makes is scoped to exactly that material.",
  },
  {
    card: "bg-[var(--ochre-f)]",
    num: "bg-[var(--ochre)]",
    title: "text-[var(--ochre-d)]",
    heading: "Study what you'll be tested on",
    body: "Get guides, quizzes, and a tutor that only know what your class covers — so studying feels like recognition, not guesswork.",
  },
];

const FEATURES = [
  {
    bg: "bg-[var(--dusk)]",
    icon: "■",
    heading: "Study guides",
    body: "Clear, well-set guides generated from your materials — written to read like a good textbook, not a cramped app panel.",
    tag: "Grounded in your materials →",
  },
  {
    bg: "bg-[var(--sage)]",
    icon: "□",
    heading: "Quizzes",
    body: "Practice questions that explain every answer — and cite the exact page it came from, so you learn as you go.",
    tag: "Scoped to your topic →",
  },
  {
    bg: "bg-[var(--ochre)]",
    icon: "☼",
    heading: "AI tutor",
    body: "Ask anything and get answers drawn only from your course — a tutor that never wanders off your syllabus.",
    tag: "Cites its sources →",
  },
];

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  // Logged-out visitors go to signup; logged-in users land on their dashboard.
  const ctaHref = authed ? "/dashboard" : "/signup";

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-clip bg-page font-sans text-ink"
      style={landingVars}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: no-preference) {
          .landing-float1 { animation: landing-floaty 5s ease-in-out infinite; }
          .landing-float2 { animation: landing-floaty 5.7s ease-in-out infinite .5s; }
          .landing-float3 { animation: landing-floaty 6.4s ease-in-out infinite .9s; }
          .landing-pulse  { animation: landing-pulse 3s ease-in-out infinite; }
        }
        @keyframes landing-floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes landing-pulse  { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-30 border-b border-rule bg-[rgba(244,241,233,.85)] backdrop-blur-[10px]">
        <div className={cn(container, "flex h-[66px] items-center gap-[30px]")}>
          <Brand href={authed ? "/dashboard" : "/"} />
          <div className="hidden gap-[26px] min-[861px]:flex">
            <a
              href="#how"
              className="text-[14.5px] font-medium text-ink-soft hover:text-ink"
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-[14.5px] font-medium text-ink-soft hover:text-ink"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-[14.5px] font-medium text-ink-soft hover:text-ink"
            >
              Pricing
            </a>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3.5">
            <Link
              href="/login"
              className="text-[14.5px] font-medium text-ink-soft hover:text-ink"
            >
              Log in
            </Link>
            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ variant: "primary" }),
                primaryShadow
              )}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden pt-[70px] pb-16">
        {/* floating playful shapes */}
        <span className="absolute top-20 right-[44%] z-0 hidden size-[26px] rounded-full bg-[var(--ochre)] min-[861px]:block" />
        <span className="absolute top-[220px] left-[2%] z-0 hidden size-14 rotate-12 rounded-xl bg-[var(--sage-f)] min-[861px]:block" />
        <span className="absolute bottom-[60px] left-[44%] z-0 hidden size-5 rounded-full bg-[var(--clay)] min-[861px]:block" />
        <span className="absolute top-[30px] left-[8%] z-0 hidden size-3.5 rounded-full bg-[var(--dusk)] min-[861px]:block" />

        <div
          className={cn(
            container,
            "relative z-[2] grid items-center gap-9 min-[861px]:grid-cols-[1.02fr_1fr]"
          )}
        >
          <div>
            <div className="mb-[22px] inline-flex items-center gap-2 rounded-full bg-[var(--clay-f)] px-[15px] py-[7px] text-[13px] font-semibold text-[var(--clay-d)]">
              ▣ Built from your own course materials
            </div>
            <h1 className="mb-[22px] font-display text-[40px] leading-[1.03] font-semibold tracking-[-0.02em] min-[861px]:text-[53px]">
              Study like you already{" "}
              <span className="relative whitespace-nowrap text-accent-deep after:absolute after:-inset-x-0.5 after:bottom-1.5 after:-z-10 after:h-3.5 after:-rotate-1 after:rounded after:bg-[var(--ochre-f)] after:content-['']">
                know the answers
              </span>
              .
            </h1>
            <p className="mb-[30px] max-w-[470px] font-read text-[19px] leading-[1.55] text-ink-soft">
              Because you do. Upload your class materials and Strattigo builds
              study guides, quizzes, and an AI tutor grounded in{" "}
              <b className="font-semibold text-ink">
                exactly what your course covers
              </b>{" "}
              — nothing generic, nothing off-topic.
            </p>
            <div className="flex items-center gap-3.5">
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  primaryShadow
                )}
              >
                Start free
              </Link>
              <a
                href="#how"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "bg-raised hover:border-accent hover:bg-raised"
                )}
              >
                See how it works
              </a>
            </div>
            <div className="mt-4 text-[13px] text-ink-faint">
              Free to start · {PRICE_MONTHLY}/mo for Pro · no card to try
            </div>
          </div>

          {/* illustration */}
          <div className="relative z-[2]">
            <div className="p-2.5">
              <svg
                viewBox="0 0 480 430"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Your course materials becoming study guides, quizzes, and an AI tutor"
                className="relative z-[1] block h-auto w-full overflow-visible"
              >
                {/* light warm blobs so bold cards pop */}
                <ellipse cx="330" cy="150" rx="140" ry="120" fill="#F4E7CB" />
                <ellipse cx="150" cy="310" rx="120" ry="100" fill="#E4EAD8" />

                {/* dotted flow */}
                <path
                  d="M 135 285 C 195 285, 205 155, 285 148"
                  fill="none"
                  stroke="#C9A98A"
                  strokeWidth="3"
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                />
                <path
                  d="M 135 292 C 205 315, 225 330, 295 312"
                  fill="none"
                  stroke="#C9A98A"
                  strokeWidth="3"
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                />

                {/* SOURCE: clay-topped material stack */}
                <g className="landing-float3">
                  <g transform="rotate(-7 100 300)">
                    <rect x="55" y="250" width="104" height="130" rx="11" fill="#F1ECE0" />
                    <rect x="48" y="243" width="104" height="130" rx="11" fill="#FBFAF6" />
                    <rect x="41" y="236" width="104" height="130" rx="11" fill="#FFFFFF" stroke="#EDE9DF" strokeWidth="1" />
                    <rect x="41" y="236" width="104" height="30" rx="11" fill="#A85A45" />
                    <rect x="41" y="256" width="104" height="10" fill="#A85A45" />
                    <text
                      x="52"
                      y="256"
                      className="font-sans"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#FFFFFF"
                    >
                      LECTURE 04.pdf
                    </text>
                    <rect x="55" y="282" width="76" height="6" rx="3" fill="#E3DED2" />
                    <rect x="55" y="296" width="76" height="6" rx="3" fill="#E3DED2" />
                    <rect x="55" y="310" width="52" height="6" rx="3" fill="#E3DED2" />
                    <rect x="55" y="330" width="76" height="6" rx="3" fill="#EDE9DF" />
                    <rect x="55" y="344" width="44" height="6" rx="3" fill="#EDE9DF" />
                  </g>
                </g>
                <g transform="translate(37 218)">
                  <circle cx="0" cy="0" r="17" fill="#5E7185" />
                  <path
                    d="M 0 7 L 0 -6 M -6 -1 L 0 -7 L 6 -1"
                    stroke="#fff"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* OUTPUT 1: guide card — DUSK, bold */}
                <g className="landing-float1">
                  <g transform="rotate(5 350 130)">
                    <rect x="258" y="66" width="184" height="128" rx="16" fill="#5E7185" />
                    <text
                      x="280"
                      y="102"
                      className="font-display"
                      fontSize="19"
                      fontWeight="600"
                      fill="#FFFFFF"
                    >
                      Glycolysis
                    </text>
                    <rect x="280" y="116" width="34" height="4" rx="2" fill="#F4C86B" />
                    <rect x="280" y="132" width="142" height="6" rx="3" fill="#fff" opacity="0.34" />
                    <rect x="280" y="146" width="142" height="6" rx="3" fill="#fff" opacity="0.34" />
                    <rect x="280" y="160" width="106" height="6" rx="3" fill="#fff" opacity="0.34" />
                    <rect x="280" y="176" width="150" height="12" rx="6" fill="#fff" opacity="0.16" />
                  </g>
                </g>

                {/* OUTPUT 2: quiz card — SAGE, bold */}
                <g className="landing-float2">
                  <g transform="rotate(-4 340 305)">
                    <rect x="262" y="248" width="180" height="118" rx="16" fill="#6E7F5E" />
                    <rect x="282" y="270" width="120" height="6" rx="3" fill="#fff" opacity="0.5" />
                    <rect x="282" y="282" width="80" height="6" rx="3" fill="#fff" opacity="0.5" />
                    <rect x="282" y="300" width="140" height="24" rx="8" fill="#FBFAF6" />
                    <circle cx="298" cy="312" r="7" fill="#4E7A57" />
                    <path
                      d="M 294.6 312 l 2.6 2.6 l 4.6 -5"
                      stroke="#fff"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect x="314" y="309" width="64" height="6" rx="3" fill="#4E7A57" opacity="0.55" />
                    <rect x="282" y="332" width="140" height="24" rx="8" fill="#fff" opacity="0.22" />
                    <circle cx="298" cy="344" r="7" fill="none" stroke="#fff" strokeWidth="1.8" opacity="0.7" />
                    <rect x="314" y="341" width="70" height="6" rx="3" fill="#fff" opacity="0.5" />
                  </g>
                </g>

                {/* OUTPUT 3: tutor bubble — OCHRE, bold */}
                <g className="landing-float3">
                  <g transform="translate(372 196)">
                    <rect x="0" y="0" width="96" height="52" rx="16" fill="#B5842F" />
                    <path d="M 20 52 l 0 12 l 14 -12 z" fill="#B5842F" />
                    <circle cx="21" cy="21" r="9" fill="#fff" opacity="0.34" />
                    <path
                      d="M 21 15 l 0 12 M 15 21 l 12 0"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <rect x="38" y="15" width="44" height="6" rx="3" fill="#fff" opacity="0.9" />
                    <rect x="38" y="29" width="32" height="6" rx="3" fill="#fff" opacity="0.6" />
                  </g>
                </g>

                {/* bold playful accents */}
                <circle cx="232" cy="212" r="8" fill="#A85A45" className="landing-pulse" />
                <path
                  d="M 250 92 l 3.5 7 l 7.5 1 l -5.5 5.4 l 1.3 7.6 l -6.8 -3.6 l -6.8 3.6 l 1.3 -7.6 l -5.5 -5.4 l 7.5 -1 z"
                  fill="#F4C86B"
                  className="landing-pulse"
                />
                <circle cx="150" cy="168" r="6" fill="#5E7185" />
                <circle cx="430" cy="300" r="7" fill="#6E7F5E" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* ── TRUST — dark band for punch ── */}
      <div className="bg-ink">
        <div
          className={cn(
            container,
            "flex flex-wrap items-center justify-center gap-[52px] py-[22px]"
          )}
        >
          {[
            ["3", "tools, done excellently"],
            ["100%", "from your materials"],
            [PRICE_MONTHLY, "a month for Pro"],
          ].map(([stat, label]) => (
            <div key={label} className="flex items-baseline gap-[9px]">
              <b className="font-display text-[25px] font-semibold text-white">
                {stat}
              </b>
              <span className="text-[13.5px] text-page/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="scroll-mt-[66px] py-[88px]">
        <div className={container}>
          <div className="mb-3.5 text-center font-sans text-eyebrow font-bold uppercase text-accent-deep">
            How it works
          </div>
          <h2 className="mx-auto mb-4 max-w-[620px] text-center font-display text-[30px] leading-[1.1] font-semibold tracking-[-0.015em] min-[861px]:text-[37px]">
            From your notes to knowing it cold — in three steps
          </h2>
          <p className="mx-auto mb-[54px] max-w-[520px] text-center font-read text-[17.5px] leading-[1.5] text-ink-soft">
            No setup, no busywork. Bring what your class already gave you and
            start studying in minutes.
          </p>
          <div className="grid gap-5 min-[861px]:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.heading}
                className={cn(
                  "relative overflow-hidden rounded-xl px-6 py-7",
                  step.card
                )}
              >
                <div
                  className={cn(
                    "mb-[18px] grid size-[38px] place-items-center rounded-full font-display text-[17px] font-semibold text-white",
                    step.num
                  )}
                >
                  {i + 1}
                </div>
                <h3
                  className={cn(
                    "mb-2 font-display text-xl font-semibold",
                    step.title
                  )}
                >
                  {step.heading}
                </h3>
                <p className="font-read text-[15.5px] leading-[1.55] text-ink-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOAT — sage band ── */}
      <div className="bg-[var(--sage-f)]">
        <div
          className={cn(
            container,
            "grid items-center gap-[52px] py-[82px] min-[861px]:grid-cols-2"
          )}
        >
          <div>
            <div className="mb-3.5 font-sans text-eyebrow font-bold uppercase text-[var(--sage-d)]">
              The difference
            </div>
            <h2 className="mb-[18px] font-display text-[30px] leading-[1.12] font-semibold tracking-[-0.015em] min-[861px]:text-[35px]">
              Generic AI guesses. Strattigo knows your class.
            </h2>
            <p className="mb-4 font-read text-[17px] leading-[1.6] text-ink-soft">
              Most AI study tools answer from the whole internet — drifting
              into things your professor never taught, missing the framing your
              exam will use.
            </p>
            <p className="mb-4 font-read text-[17px] leading-[1.6] text-ink-soft">
              Strattigo only ever draws from{" "}
              <b className="font-semibold text-ink">
                the materials you upload
              </b>
              . Scope it to a single collection and every guide, quiz, and
              answer comes from that exact subtree — cited back to the source
              page.
            </p>
            <ul className="mt-[22px]">
              {[
                "Answers grounded in your professor's actual material",
                "Every response cites the file it came from",
                "Nested collections let you study one topic at a time",
              ].map((item) => (
                <li
                  key={item}
                  className="mb-[13px] flex items-start gap-3 font-read text-read-s text-ink-soft"
                >
                  <span className="mt-0.5 shrink-0 text-[16px] font-bold text-success">
                    ✓
                  </span>{" "}
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-raised p-[26px] shadow-[0_18px_44px_rgba(84,99,74,.16)]">
            <div className="mb-4 text-[12px] font-bold tracking-[0.05em] uppercase text-ink-faint">
              Generate from
            </div>
            <div className="font-sans text-ui">
              <div className="flex items-center gap-[9px] rounded-sm px-2.5 py-2 text-ink-soft">
                <span className="text-[13px] text-accent">▾</span> Biochemistry
                301
              </div>
              <div className="ml-6 flex items-center gap-[9px] rounded-sm px-2.5 py-2 text-ink-soft">
                <span className="text-[13px] text-accent">▸</span> Unit 1 —
                Foundations
              </div>
              <div className="ml-6 flex items-center gap-[9px] rounded-sm px-2.5 py-2 text-ink-soft">
                <span className="text-[13px] text-accent">▸</span> Unit 2 —
                Enzymes
              </div>
              <div className="ml-6 flex items-center gap-[9px] rounded-sm bg-accent-tint px-2.5 py-2 font-semibold text-accent-deep">
                <span className="text-[13px] text-accent-deep">▾</span> Unit 3
                — Metabolism
              </div>
              <div className="ml-12 flex items-center gap-[9px] rounded-sm bg-accent-tint px-2.5 py-2 font-semibold text-accent-deep">
                ▣ Glycolysis
              </div>
              <div className="ml-12 flex items-center gap-[9px] rounded-sm bg-accent-tint px-2.5 py-2 font-semibold text-accent-deep">
                ▣ Citric acid cycle
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-[7px] rounded-full bg-accent px-[15px] py-[9px] text-[12.5px] font-medium text-white">
              ▣ Studying Unit 3 — 9 files, nothing else
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES — big bold colored cards ── */}
      <section id="features" className="scroll-mt-[66px] py-[88px]">
        <div className={container}>
          <div className="mb-3.5 text-center font-sans text-eyebrow font-bold uppercase text-accent-deep">
            Three tools, done excellently
          </div>
          <h2 className="mx-auto mb-4 max-w-[620px] text-center font-display text-[30px] leading-[1.1] font-semibold tracking-[-0.015em] min-[861px]:text-[37px]">
            Everything you need to study. Nothing you don&apos;t.
          </h2>
          <p className="mx-auto mb-[54px] max-w-[520px] text-center font-read text-[17.5px] leading-[1.5] text-ink-soft">
            We do three things extraordinarily well instead of ten things
            adequately.
          </p>
          <div className="mt-2 grid gap-5 min-[861px]:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.heading}
                className={cn(
                  "relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl px-7 py-8 text-white transition-transform duration-150 hover:-translate-y-1",
                  "after:absolute after:-right-[50px] after:-bottom-[50px] after:size-[150px] after:rounded-full after:bg-white/[.09] after:content-['']",
                  feature.bg
                )}
              >
                <div className="relative z-[1] mb-[22px] grid size-[52px] place-items-center rounded-[14px] bg-white/[.18] text-2xl">
                  {feature.icon}
                </div>
                <h3 className="relative z-[1] mb-2.5 font-display text-[23px] font-semibold">
                  {feature.heading}
                </h3>
                <p className="relative z-[1] flex-1 font-read text-[15.5px] leading-[1.55] text-white/90">
                  {feature.body}
                </p>
                <span className="relative z-[1] mt-[18px] inline-flex items-center gap-1.5 text-[13px] font-semibold">
                  {feature.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id="pricing"
        className="scroll-mt-[66px] border-y border-rule bg-sheet py-[88px]"
      >
        <div className={container}>
          <div className="mb-3.5 text-center font-sans text-eyebrow font-bold uppercase text-accent-deep">
            Pricing
          </div>
          <h2 className="mx-auto mb-4 max-w-[620px] text-center font-display text-[30px] leading-[1.1] font-semibold tracking-[-0.015em] min-[861px]:text-[37px]">
            Start free. Upgrade when you&apos;re hooked.
          </h2>
          <p className="mx-auto mb-[54px] max-w-[520px] text-center font-read text-[17.5px] leading-[1.5] text-ink-soft">
            One simple plan when you&apos;re ready. No tiers to decode.
          </p>
          <div className="mx-auto grid max-w-[760px] gap-[22px] min-[861px]:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-rule bg-raised px-[30px] py-8">
              <div className="mb-1.5 font-display text-[22px] font-semibold">
                Free
              </div>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="font-display text-[44px] font-semibold tracking-[-0.02em]">
                  $0
                </span>
                <span className="text-[15px] text-ink-faint">forever</span>
              </div>
              <p className="mb-6 font-read text-[14.5px] text-ink-soft">
                Everything you need to try it on a real course.
              </p>
              <ul className="mb-[26px]">
                {FREE_FEATURES.map((item) => (
                  <li
                    key={item}
                    className="mb-3 flex items-start gap-2.5 text-[14.5px] text-ink-soft"
                  >
                    <span className="mt-px shrink-0 font-bold text-success">
                      ✓
                    </span>{" "}
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full bg-raised hover:border-accent hover:bg-raised"
                )}
              >
                Start free
              </Link>
            </div>
            {/* Pro */}
            <div className="relative rounded-xl border-[2.5px] border-accent bg-raised px-[30px] py-8 shadow-[0_18px_44px_rgba(94,113,133,.16)]">
              <div className="absolute -top-[13px] left-[30px] rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-bold text-white">
                For serious semesters
              </div>
              <div className="mb-1.5 font-display text-[22px] font-semibold">
                Pro
              </div>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="font-display text-[44px] font-semibold tracking-[-0.02em]">
                  {PRICE_MONTHLY}
                </span>
                <span className="text-[15px] text-ink-faint">/ month</span>
              </div>
              <p className="mb-6 font-read text-[14.5px] text-ink-soft">
                Every course you&apos;re taking, all at once.
              </p>
              <ul className="mb-[26px]">
                {PRO_FEATURES.map((item) => (
                  <li
                    key={item}
                    className="mb-3 flex items-start gap-2.5 text-[14.5px] text-ink-soft"
                  >
                    <span className="mt-px shrink-0 font-bold text-success">
                      ✓
                    </span>{" "}
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "w-full",
                  primaryShadow
                )}
              >
                Go Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — bold dusk block ── */}
      <div className="py-20">
        <div className={container}>
          <div className="relative overflow-hidden rounded-2xl bg-[var(--dusk)] px-10 py-[72px] text-center before:absolute before:-top-[60px] before:-left-10 before:size-[200px] before:rounded-full before:bg-white/[.07] before:content-[''] after:absolute after:-right-[30px] after:-bottom-[70px] after:size-[220px] after:rounded-full after:bg-white/[.06] after:content-['']">
            <h2 className="relative z-[1] mx-auto mb-[18px] max-w-[600px] font-display text-[34px] leading-[1.08] font-semibold tracking-[-0.02em] text-white min-[861px]:text-[42px]">
              Walk into the exam like you&apos;ve{" "}
              <span className="italic text-[var(--ochre-f)]">
                seen it before
              </span>
              .
            </h2>
            <p className="relative z-[1] mx-auto mb-[30px] max-w-[440px] font-read text-lg leading-[1.5] text-white/[.88]">
              Because you have — you studied the exact material it&apos;s built
              from.
            </p>
            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "relative z-[1] bg-white text-ink transition hover:-translate-y-px hover:bg-white"
              )}
            >
              Start free
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
