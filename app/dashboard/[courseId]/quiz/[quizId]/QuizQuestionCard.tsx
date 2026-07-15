import { Check, X } from "lucide-react";

import { AppMarkdown } from "@/app/components/ui/GuideMarkdown";
import { Callout } from "@/components/ui/callout";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/app/lib/api";

/**
 * QuizQuestionCard — the ONE rendering of a quiz question (quiz-view.html
 * Moments 2/3a/3b). Deliberately the single path for every place a question
 * appears: taking a just-streamed quiz, taking a reopened saved quiz, and the
 * expanded rows of the results review list — same prompt, same option cards,
 * same explanation callout. Nothing else renders question content.
 *
 * States: unanswered (options selectable) → selected (accent) → resolved
 * (correct option always affirmed in success green; a wrong pick shows in
 * error red; the rest mute). Semantic colors carry correctness ONLY.
 * Prompt/options/explanation are markdown (may carry LaTeX) — all rendered
 * through the shared AppMarkdown pipeline at app density.
 */
export function QuizQuestionCard({
  question,
  number,
  selected,
  resolved,
  onSelect,
}: {
  question: QuizQuestion;
  /** 1-based display number. */
  number: number;
  /** The picked option letter, if any. */
  selected: string | null;
  /** Answer has been checked — show correctness + explanation. */
  resolved: boolean;
  onSelect?: (letter: string) => void;
}) {
  const correct = question.correctAnswer;
  const isRight = resolved && selected === correct;

  return (
    <div className="rise-in-fast">
      <div className="mb-4 font-sans text-eyebrow font-semibold uppercase tracking-[0.09em] text-accent-deep">
        Question {number}
      </div>

      {/* Display-scale prompt; a div (not h2) because markdown emits block
          elements that can't nest inside a heading. */}
      <div className="mb-[30px] font-display text-[27px] font-semibold leading-[1.28] tracking-[-0.008em] text-ink max-md:text-[22px]">
        <AppMarkdown content={question.question} />
      </div>

      <div className="flex flex-col gap-3" role="group" aria-label={`Answers for question ${number}`}>
        {question.options.map((opt) => {
          const isSel = selected === opt.letter;
          const isCorrectOpt = opt.letter === correct;
          const resolvedCorrect = resolved && isCorrectOpt;
          const resolvedWrong = resolved && isSel && !isCorrectOpt;
          const resolvedMuted = resolved && !isCorrectOpt && !isSel;

          return (
            <button
              key={opt.letter}
              type="button"
              disabled={resolved}
              aria-pressed={isSel}
              onClick={() => onSelect?.(opt.letter)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-lg border px-[18px] py-4 text-left font-read text-[17.5px] leading-[1.45] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
                !resolved &&
                  (isSel
                    ? "cursor-pointer border-accent bg-accent-tint text-ink"
                    : "cursor-pointer border-rule-strong bg-raised text-ink hover:border-accent hover:bg-accent-tint"),
                resolvedCorrect && "border-success bg-success-tint text-success-deep",
                resolvedWrong && "border-error bg-error-tint text-error-deep",
                resolvedMuted && "border-rule-strong bg-raised text-ink opacity-55"
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-[7px] font-sans text-ui-s font-semibold",
                  resolvedCorrect
                    ? "bg-success text-white"
                    : resolvedWrong
                      ? "bg-error text-white"
                      : isSel && !resolved
                        ? "bg-accent text-white"
                        : "bg-sunk text-ink-soft"
                )}
              >
                {opt.letter}
              </span>
              <AppMarkdown content={opt.text} className="min-w-0 flex-1" />
              {resolvedCorrect && (
                <Check aria-label="Correct answer" className="check-pop ml-auto size-[18px] shrink-0 text-success" />
              )}
              {resolvedWrong && (
                <X aria-label="Your answer" className="ml-auto size-[18px] shrink-0 text-error" />
              )}
            </button>
          );
        })}
      </div>

      {resolved && (
        <Callout
          variant={isRight ? "success" : "error"}
          label={
            <span className="flex items-center gap-2">
              {isRight ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {isRight ? "Correct" : `Not quite — you chose ${selected ?? "—"}`}
            </span>
          }
          className="rise-in-fast mt-[22px] px-[22px] py-5 text-[16.5px] leading-[1.6]"
        >
          <AppMarkdown
            content={question.explanation ?? `The correct answer is ${correct}.`}
          />
        </Callout>
      )}
    </div>
  );
}
