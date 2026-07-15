import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { AppMarkdown } from "@/app/components/ui/GuideMarkdown";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/app/lib/api";

import { QuizQuestionCard } from "./QuizQuestionCard";

/**
 * QuizResults — the consolidation screen after finishing (quiz-view.html
 * Moment 4). Feedback was already immediate per-question, so this screen's job
 * is pointing back to studying: score ring, a "worth revisiting" block that
 * links to a study guide on the same scope, and a per-question review list
 * whose rows expand into the shared QuizQuestionCard (the one render path).
 *
 * This is the just-finished view — answers live in memory. Saved quizzes do
 * NOT persist the student's picks or score (see FUTURE-ENHANCEMENTS.md), so a
 * reopened quiz starts fresh in take mode instead of replaying this screen.
 */
/** True when the OS asks for reduced motion — gates the JS-driven pieces
    (count-up, confetti); CSS motion is neutralized globally. */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Counts 0 → target over ~900ms in sync with the ring draw. */
function useCountUp(target: number) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 900, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

/* Muted subject-palette confetti — one soft burst over the score ring,
   then gone. Rendered only for strong scores and never under
   prefers-reduced-motion. Transform/opacity only. */
const CONFETTI_HUES = [
  "var(--color-subject-dusk)",
  "var(--color-subject-sage)",
  "var(--color-subject-ochre)",
  "var(--color-subject-clay)",
  "var(--color-subject-plum)",
];

function ConfettiBurst() {
  const [pieces] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
      color: CONFETTI_HUES[i % CONFETTI_HUES.length],
      x: (Math.random() - 0.5) * 320,
      y: -30 - Math.random() * 140 + (Math.random() < 0.4 ? 220 : 0),
      r: (Math.random() - 0.5) * 540,
      t: 1 + Math.random() * 0.5,
      d: Math.random() * 0.15,
      w: 5 + Math.random() * 4,
      round: Math.random() < 0.35,
    }))
  );
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGone(true), 1900);
    return () => clearTimeout(id);
  }, []);
  if (gone) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              width: p.w,
              height: p.round ? p.w : p.w * 1.9,
              borderRadius: p.round ? "50%" : 1.5,
              background: p.color,
              "--cf-x": `${p.x}px`,
              "--cf-y": `${p.y}px`,
              "--cf-r": `${p.r}deg`,
              "--cf-t": `${p.t}s`,
              "--cf-d": `${p.d}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function QuizResults({
  questions,
  answers,
  scopeName,
  guideNewHref,
  onRetake,
  canSave,
  saved,
  onSave,
}: {
  questions: QuizQuestion[];
  /** Picked letter per question index. */
  answers: Record<number, string>;
  scopeName: string;
  /** Route to guide generation on the same scope — the "go study" pointer. */
  guideNewHref: string;
  onRetake: () => void;
  /** False for reopened saved quizzes (already saved). */
  canSave: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const total = questions.length;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const missCount = total - correctCount;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const heading =
    pct === 100
      ? "A clean sweep"
      : pct >= 80
        ? "Nice work"
        : pct >= 60
          ? "Solid effort"
          : "A tough set — worth the review";
  const subline =
    missCount === 0
      ? `All ${total} correct. This material looks solid.`
      : `You got ${correctCount} of ${total} — ${missCount} explanation${missCount === 1 ? "" : "s"} below ${missCount === 1 ? "is" : "are"} worth a second read.`;

  // r=52 ring (quiz-view.html): circumference 2π·52.
  const C = 2 * Math.PI * 52;

  // Celebration: the ring draws in (stroke-dashoffset transition kicked off
  // one frame after mount) while the numbers count up in sync. Confetti only
  // for a strong score — a 3/10 gets a calm consolidation, not a party.
  const [ringOn, setRingOn] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRingOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const shownCorrect = useCountUp(correctCount);
  const shownPct = useCountUp(pct);
  const celebrate = pct >= 70 && !prefersReducedMotion();

  return (
    <div className="mx-auto w-full max-w-[680px] px-5 pt-12 pb-24">
      {/* Hero */}
      <div ref={heroRef} className="rise-in border-b border-rule pb-9 text-center">
        <div className="relative mx-auto mb-[22px] size-[120px]">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" stroke="currentColor" className="text-sunk" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="10"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={ringOn ? C * (1 - correctCount / Math.max(1, total)) : C}
              style={{ transition: "stroke-dashoffset 900ms var(--ease-out-soft)" }}
              className="text-accent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="font-display text-[34px] font-semibold leading-none text-ink">
              {shownCorrect}/{total}
            </b>
            <span className="mt-1 font-sans text-ui-s text-ink-faint">{shownPct}% correct</span>
          </div>
          {celebrate && <ConfettiBurst />}
        </div>
        <h2 className="mb-2 font-display text-[26px] font-semibold text-ink">{heading}</h2>
        <p className="font-read text-[16.5px] text-ink-soft">{subline}</p>
      </div>

      {/* Worth revisiting — the pointer back to studying */}
      <Callout
        variant="accent"
        label="Worth revisiting"
        className="rise-in mt-9 px-[22px] py-5"
        style={{ animationDelay: "90ms" }}
      >
        {missCount > 0 ? (
          <p>
            The {missCount === 1 ? "question you missed is" : `${missCount} questions you missed are`}{" "}
            marked below — each explanation says why the tempting pick falls short.{" "}
            <Link href={guideNewHref} className="font-semibold underline underline-offset-2">
              Generate a study guide from {scopeName} →
            </Link>
          </p>
        ) : (
          <p>
            Nothing tripped you up here. If this felt easy, regenerate at a harder difficulty — or{" "}
            <Link href={guideNewHref} className="font-semibold underline underline-offset-2">
              move on to the next topic →
            </Link>
          </p>
        )}
      </Callout>

      {/* Per-question review */}
      <div className="rise-in mt-9" style={{ animationDelay: "170ms" }}>
        <div className="mb-2 font-sans text-eyebrow font-semibold uppercase tracking-[0.06em] text-ink-faint">
          Review all {total} questions
        </div>
        {questions.map((q, i) => {
          const picked = answers[i];
          const right = picked === q.correctAnswer;
          const expanded = expandedIdx === i;
          return (
            <div key={i} className="border-b border-rule-soft py-4">
              <div className="flex items-start gap-3.5">
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                    right ? "bg-success-tint text-success" : "bg-error-tint text-error"
                  )}
                >
                  {right ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-read text-[16px] leading-[1.4] text-ink">
                    <AppMarkdown content={q.question} />
                  </div>
                  <div className="mt-0.5 font-sans text-ui-s text-ink-faint">
                    {right ? (
                      <>Your answer: {picked}</>
                    ) : (
                      <>
                        You chose {picked ?? "—"} · correct:{" "}
                        <span className="font-medium text-accent-deep">{q.correctAnswer}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expanded ? null : i)}
                  className="cursor-pointer self-center font-sans text-ui-s font-medium whitespace-nowrap text-accent-deep hover:underline"
                >
                  {expanded ? "Hide" : "Review"}
                </button>
              </div>
              {expanded && (
                <div className="mt-6">
                  <QuizQuestionCard
                    question={q}
                    number={i + 1}
                    selected={picked ?? null}
                    resolved
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="rise-in mt-9 flex justify-center gap-3" style={{ animationDelay: "250ms" }}>
        <Button variant="secondary" onClick={onRetake}>
          Retake quiz
        </Button>
        {canSave &&
          (saved ? (
            <Button variant="ghost" disabled>
              <Check /> Saved
            </Button>
          ) : (
            <Button variant="primary" onClick={onSave}>
              Save quiz
            </Button>
          ))}
      </div>
    </div>
  );
}
