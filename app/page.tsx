"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PRICE_MONTHLY } from "@/components/public/plans";
import { cn } from "@/lib/utils";
import { getToken } from "./lib/api";

/**
 * Landing page — Duna-structure redesign ("Dawn" direction).
 *
 * Massive centered type, huge whitespace, near-monochrome sections with four
 * deliberate color moments (the filetype row + step numerals), and a warm
 * all-CSS dawn gradient bookending the page (hero + final band). No images —
 * the gradient IS the artwork, with a static film-grain overlay on top.
 *
 * Landing-only styles on purpose: the dark ink pill CTA and the dawn palette
 * exist nowhere else in the app — do NOT promote them to globals.css or the
 * shared Button. The landing also carries its own hero nav and footer variant
 * (ink brand tile, single-row footer); PublicNav/PublicFooter stay untouched
 * for /pricing and the legal pages.
 */

/* The dark ink pill — the ONE CTA style on this page (never accent-blue). */
const darkPill =
  "inline-flex items-center justify-center rounded-full bg-ink font-sans font-medium text-page shadow-[0_10px_26px_rgba(35,33,28,.16)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(35,33,28,.22)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:outline-none";
const darkPillHero = "px-[34px] py-4 text-[16px]";
const darkPillNav = "px-[26px] py-[13px] text-[14.5px]";

/* Static film grain — inline SVG feTurbulence, multiplied over the gradients. */
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* Dawn gradients — gold at the top dissolving into page cream (hero), and a
   contained sunrise for the final band. Exact stops per the design spec. */
const DAWN_HERO = [
  "radial-gradient(90% 60% at 50% 0%, #F6D9A8 0%, rgba(246,217,168,0) 60%)",
  "radial-gradient(70% 55% at 18% 12%, #F3E3C2 0%, rgba(243,227,194,0) 55%)",
  "radial-gradient(75% 60% at 84% 14%, #EFC9A6 0%, rgba(239,201,166,0) 58%)",
  "radial-gradient(85% 55% at 70% 46%, #EAC2B4 0%, rgba(234,194,180,0) 60%)",
  "radial-gradient(80% 50% at 26% 52%, #E8CBB2 0%, rgba(232,203,178,0) 58%)",
  "linear-gradient(180deg,#F4DDB6 0%,#F1D6BC 34%,#F3E2CE 62%,#F4F1E9 100%)",
].join(",");

const DAWN_BAND = [
  "radial-gradient(80% 70% at 50% 0%,#F6D9A8 0%,rgba(246,217,168,0) 60%)",
  "radial-gradient(70% 60% at 20% 80%,#EAC2B4 0%,rgba(234,194,180,0) 60%)",
  "radial-gradient(70% 60% at 82% 78%,#E8CBB2 0%,rgba(232,203,178,0) 58%)",
  "linear-gradient(165deg,#F6E4C4 0%,#F2DAC4 55%,#EFD6CA 100%)",
].join(",");

const container = "mx-auto w-full max-w-[1240px] px-6 sm:px-10";

/* The four deliberate color moments (muted filetype hues, reused by steps). */
const FILE_TYPES = [
  { label: "PDF", color: "#A6503F" },
  { label: "SLIDES", color: "#B5842F" },
  { label: "DOCS", color: "#5E7185" },
  { label: "NOTES", color: "#6E7F5E" },
];

const STEPS = [
  {
    num: "01",
    color: "#B5842F",
    heading: "Upload your course",
    body: "Lecture slides, readings, notes — drop them in and organize them into collections.",
  },
  {
    num: "02",
    color: "#A85A45",
    heading: "Generate your study kit",
    body: "Study guides and quizzes built from your materials — scoped to the whole course or one lecture.",
  },
  {
    num: "03",
    color: "#5E7185",
    heading: "Ask your tutor",
    body: "Chat with an AI that only knows your class — not random internet facts.",
  },
];

function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply"
      style={{ backgroundImage: GRAIN_BG }}
    />
  );
}

/* Landing brand lockup — ink tile, unlike the accent tile PublicNav uses. */
function LandingBrand({ href, small }: { href: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-2.5">
      <span
        className={cn(
          "grid place-items-center rounded-[9px] bg-ink font-display font-semibold text-page",
          small ? "size-7 text-[15px]" : "size-8 text-[17px]"
        )}
      >
        S
      </span>
      <span
        className={cn(
          "font-display font-semibold tracking-[-0.01em] text-ink",
          small ? "text-[17px]" : "text-[19px]"
        )}
      >
        Strattigo
      </span>
    </Link>
  );
}

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  // Logged-out visitors go to signup; logged-in users land on their dashboard.
  const ctaHref = authed ? "/dashboard" : "/signup";

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-page font-sans text-ink">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          html { scroll-behavior: smooth; }
        }
      `}</style>

      {/* ── 1 · HERO — dawn gradient, everything centered ── */}
      <header
        className="relative flex min-h-[780px] flex-col overflow-hidden"
        style={{ background: DAWN_HERO }}
      >
        <Grain />

        {/* Transparent nav over the gradient */}
        <nav className="relative z-10">
          <div
            className={cn(container, "relative flex h-[84px] items-center")}
          >
            <LandingBrand href={authed ? "/dashboard" : "/"} />
            {/* Center links collapse below 861px — known logged nav item; the
                guaranteed minimum (brand + Start free) always stays visible. */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 gap-9 min-[861px]:flex">
              <a
                href="#how"
                className="text-[14.5px] font-medium text-ink-soft hover:text-ink"
              >
                How it works
              </a>
              <Link
                href="/pricing"
                className="text-[14.5px] font-medium text-ink-soft hover:text-ink"
              >
                Pricing
              </Link>
            </div>
            <div className="flex-1" />
            <Link
              href="/login"
              className="mr-5 hidden text-[14.5px] font-medium text-ink-soft hover:text-ink min-[480px]:block"
            >
              Log in
            </Link>
            <Link href={ctaHref} className={cn(darkPill, darkPillNav)}>
              Start free
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-14 pb-24 text-center">
          <div className="mb-8 inline-flex items-center rounded-full bg-[rgba(35,33,28,.82)] px-[18px] py-2 text-[13px] font-medium tracking-[0.01em] text-page">
            Built from your teacher’s actual materials
          </div>
          <h1 className="mx-auto mb-7 max-w-[960px] font-display text-[clamp(40px,7.4vw,82px)] leading-[1.02] font-semibold tracking-[-0.025em]">
            Study like you already <em className="italic">know the answers</em>.
          </h1>
          <p className="mx-auto mb-10 max-w-[640px] font-read text-[19px] leading-[1.55] text-ink-soft min-[861px]:text-[21px]">
            Upload your class materials and Strattigo builds study guides,
            quizzes, and an AI tutor grounded in exactly what your course
            covers.
          </p>
          <Link href={ctaHref} className={cn(darkPill, darkPillHero)}>
            Start free
          </Link>
          <div className="mt-4 text-[13px] text-ink-faint">
            Free to start · {PRICE_MONTHLY}/mo for Pro · no card required
          </div>
        </div>
      </header>

      {/* ── 2 · FILE-TYPE STRIP ── */}
      <section className="border-b border-rule">
        <div className={cn(container, "py-16 text-center")}>
          <div className="mb-7 font-read text-[15px] text-ink-faint">
            Works with the materials you already have
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {FILE_TYPES.map((ft) => (
              <span
                key={ft.label}
                className="font-sans text-[22px] font-bold tracking-[0.08em]"
                style={{ color: ft.color }}
              >
                {ft.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 · THREE STEPS ── */}
      <section id="how" className="scroll-mt-8 border-b border-rule">
        <div className={cn(container, "py-[90px] min-[861px]:py-[140px]")}>
          <h2 className="mb-16 max-w-[560px] font-display text-[clamp(34px,4.6vw,52px)] leading-[1.08] font-semibold tracking-[-0.02em] min-[861px]:mb-24">
            From your professor’s slides to your best grade.
          </h2>
          <div className="grid gap-14 min-[861px]:grid-cols-3 min-[861px]:gap-10">
            {STEPS.map((step) => (
              <div key={step.num}>
                <div
                  className="font-sans text-[clamp(64px,8vw,92px)] leading-none font-bold tracking-[-0.03em]"
                  style={{ color: step.color }}
                >
                  {step.num}
                </div>
                <h3 className="mt-5 mb-2.5 font-sans text-[18px] font-bold">
                  {step.heading}
                </h3>
                <p className="max-w-[340px] font-read text-[16px] leading-[1.55] text-ink-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · MOAT ── */}
      <section className="border-b border-rule">
        <div
          className={cn(
            container,
            "py-[100px] text-center min-[861px]:py-[150px]"
          )}
        >
          <h2 className="mx-auto mb-6 max-w-[820px] font-display text-[clamp(36px,5vw,58px)] leading-[1.05] font-semibold tracking-[-0.02em]">
            It only knows your class.
          </h2>
          <p className="mx-auto mb-16 max-w-[640px] font-read text-[19px] leading-[1.55] text-ink-soft">
            Not the internet. Not a generic textbook. Your professor’s slides,
            your readings, your notes — scoped to exactly what’s on the exam.
          </p>
          {/* Structural testimonial slot — honestly labeled, no fake person. */}
          <figure
            className="mx-auto max-w-[820px] rounded-[18px] border border-[#EBD9BE] px-8 py-10 text-left min-[861px]:px-12"
            style={{
              background:
                "linear-gradient(140deg,#FBF0DC 0%,#F8E7D6 55%,#F6E3D8 100%)",
            }}
          >
            <blockquote className="font-display text-[clamp(22px,2.6vw,29px)] leading-[1.35] font-medium">
              “The quiz asked me about the exact diagram from Lecture 12.
              That’s when it clicked — this thing actually read my slides.”
            </blockquote>
            <figcaption className="mt-5 font-sans text-[13px] text-ink-faint">
              The moment Strattigo makes sense
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── 5 · FINAL CTA — dawn band bookending the hero ── */}
      <div className="px-4 py-[90px] sm:px-12">
        <div
          className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[24px] px-6 py-[70px] text-center min-[861px]:py-[110px]"
          style={{ background: DAWN_BAND }}
        >
          <Grain />
          <div className="relative z-10">
            <h2 className="mx-auto mb-10 max-w-[760px] font-display text-[clamp(38px,5.6vw,64px)] leading-[1.05] font-semibold tracking-[-0.02em]">
              Ready for your next exam?
            </h2>
            <Link href={ctaHref} className={cn(darkPill, darkPillHero)}>
              Start free
            </Link>
          </div>
        </div>
      </div>

      {/* ── 6 · FOOTER — landing variant (single row; PublicFooter untouched) ── */}
      <footer className="border-t border-rule">
        <div
          className={cn(
            container,
            "flex flex-wrap items-center gap-x-8 gap-y-4 py-9"
          )}
        >
          <LandingBrand small href={authed ? "/dashboard" : "/"} />
          <div className="flex-1" />
          <nav className="flex gap-6 font-sans text-ui-s text-ink-faint">
            <Link href="/pricing" className="hover:text-ink-soft">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-ink-soft">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink-soft">
              Privacy
            </Link>
          </nav>
          <span className="font-sans text-[12.5px] text-ink-faint">
            © 2026 Strattigo
          </span>
        </div>
      </footer>
    </div>
  );
}
