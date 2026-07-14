import { useState } from "react";
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

  return (
    <div className="mx-auto w-full max-w-[680px] px-5 pt-12 pb-24">
      {/* Hero */}
      <div className="border-b border-rule pb-9 text-center">
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
              strokeDashoffset={C * (1 - correctCount / Math.max(1, total))}
              className="text-accent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="font-display text-[34px] font-semibold leading-none text-ink">
              {correctCount}/{total}
            </b>
            <span className="mt-1 font-sans text-ui-s text-ink-faint">{pct}% correct</span>
          </div>
        </div>
        <h2 className="mb-2 font-display text-[26px] font-semibold text-ink">{heading}</h2>
        <p className="font-read text-[16.5px] text-ink-soft">{subline}</p>
      </div>

      {/* Worth revisiting — the pointer back to studying */}
      <Callout variant="accent" label="Worth revisiting" className="mt-9 px-[22px] py-5">
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
      <div className="mt-9">
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
      <div className="mt-9 flex justify-center gap-3">
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
