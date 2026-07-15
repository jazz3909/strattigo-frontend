"use client";

import {
  Component,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";

import { WorkspaceRail, type RailView } from "@/components/shell/workspace-rail";
import { WorkspaceTopBar } from "@/components/shell/workspace-top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScopePicker } from "@/components/ui/scope-picker";
import { SegmentedProgress } from "@/components/ui/progress";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";

import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizResults } from "./QuizResults";
import { useToast } from "@/app/providers/ToastProvider";
import {
  getCourse,
  getCollections,
  getMaterials,
  getSavedQuizzes,
  parseQuizMarkdown,
  saveQuiz,
  streamQuiz,
  type Course,
  type Collection,
  type QuizDifficulty,
  type QuizSaved,
} from "@/app/lib/api";
import { buildCollectionTree, findNode } from "@/app/lib/collectionTree";

// Honest message when generation yields nothing usable (mirrors the guide view).
const NO_USABLE_MATERIALS_MESSAGE =
  "We couldn't generate this from the selected materials. The materials in this collection may be too limited, or a file may not have processed correctly (e.g. a scanned or formula-heavy PDF). Try adding more materials or re-uploading.";

// Cycling status lines shown before the first question lands (presentation only).
const GENERATING_MESSAGES = [
  "Reading your materials…",
  "Picking what's worth testing…",
  "Writing the questions…",
  "Making the wrong answers tempting…",
  "Checking the answer key…",
];

// Centered taking column. The question, its option cards, and both top strips
// (breadcrumb + progress) share this width and gutter so they read as one
// composed, contained unit — a confident centered column, not a narrow strip
// marooned in a big empty frame. Contained-and-centered is intended here (a
// quiz is a focused activity), just wide enough that the side margins are a
// comfortable result rather than dead voids.
const TAKE_COLUMN = "mx-auto w-full max-w-[1040px] px-5";

// QuizRequest accepts 1–50; these are the offered presets (quiz-view.html).
const COUNT_OPTIONS = ["5", "10", "15", "20"] as const;
const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

/** Preserved guardrail: quiz content is AI-parsed markdown — a render crash
 *  must not take down the workspace (the old QuizTab had the same boundary). */
class QuizSurfaceBoundary extends Component<
  { onExit: () => void; children: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Quiz render error:", error);
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="mt-24 max-w-md px-10">
          <p className="font-read text-read-s text-error-deep">
            This quiz failed to render — please regenerate it.
          </p>
          <div className="mt-6">
            <Button variant="secondary" onClick={this.props.onExit}>
              Back to quizzes
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type Phase = "take" | "results";

export default function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = use(params);
  const isNew = quizId === "new";
  const router = useRouter();
  const { addToast } = useToast();

  // ── Workspace-frame data (course identity + scope tree) ──
  const [course, setCourse] = useState<Course | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [materialCount, setMaterialCount] = useState(0);
  const [scopedId, setScopedId] = useState<string | null>(null);

  // ── The quiz being taken (saved mode) ──
  const [savedRow, setSavedRow] = useState<QuizSaved | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Generation (new mode) ──
  const [modalOpen, setModalOpen] = useState(false);
  const [countInput, setCountInput] = useState<(typeof COUNT_OPTIONS)[number]>("10");
  const [difficultyInput, setDifficultyInput] = useState<QuizDifficulty>("medium");
  const [genState, setGenState] = useState<"idle" | "streaming" | "done">("idle");
  const [genError, setGenError] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [rawContent, setRawContent] = useState("");
  const [streamedQuestions, setStreamedQuestions] = useState<
    ReturnType<typeof parseQuizMarkdown>
  >([]);
  const [statusIdx, setStatusIdx] = useState(0);
  const autoOpenedRef = useRef(false);

  // ── Taking ──
  const [phase, setPhase] = useState<Phase>("take");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // ── Saving (new mode) ──
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const exitAfterSaveRef = useRef(false);

  const tree = useMemo(() => buildCollectionTree(collections), [collections]);
  const scopeName =
    (scopedId != null && findNode(tree, scopedId)?.name) || course?.name || "";

  // Saved quizzes persist only the raw markdown — parse it back to questions.
  const savedQuestions = useMemo(
    () => (savedRow ? parseQuizMarkdown(savedRow.content) : []),
    [savedRow]
  );
  const questions = isNew ? streamedQuestions : savedQuestions;
  const streaming = genState === "streaming";

  // Load the workspace frame + (saved mode) the quiz itself. There is no
  // single-quiz endpoint — the real mechanism is to list the course's saved
  // quizzes and find this id (same as guides).
  useEffect(() => {
    let cancelled = false;
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("scope");
      if (q) setScopedId(q);
    }
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [c, cols, mats] = await Promise.all([
          getCourse(courseId),
          getCollections(courseId),
          getMaterials(courseId).catch(() => []),
        ]);
        if (cancelled) return;
        setCourse(c);
        setCollections(cols);
        setMaterialCount(mats.length);

        if (!isNew) {
          const saved = await getSavedQuizzes(courseId);
          if (cancelled) return;
          const found = saved.find((s) => s.id === quizId);
          if (!found) {
            setLoadError("This quiz could not be found. It may have been deleted.");
          } else {
            setSavedRow(found);
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, quizId, isNew]);

  // In new mode, open the generation modal once the frame is ready — exactly
  // once, so a generation error surfaces its own retry screen instead of
  // silently reopening the modal.
  useEffect(() => {
    if (isNew && !loading && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setModalOpen(true);
    }
  }, [isNew, loading]);

  // Cycle the status line while waiting for the first question.
  useEffect(() => {
    if (!streaming) return;
    const t = setInterval(
      () => setStatusIdx((i) => (i + 1) % GENERATING_MESSAGES.length),
      2600
    );
    return () => clearInterval(t);
  }, [streaming]);

  function navTab(view: RailView) {
    switch (view) {
      case "courses":
        router.push("/dashboard");
        break;
      case "chat":
        router.push(`/dashboard/${courseId}/chat`);
        break;
      case "guides":
        router.push(`/dashboard/${courseId}/guides`);
        break;
      case "quizzes":
        router.push(`/dashboard/${courseId}/quizzes`);
        break;
      case "materials":
        router.push(`/dashboard/${courseId}/materials`);
        break;
      case "settings":
        router.push("/settings/billing");
        break;
    }
  }

  const quizzesHref = `/dashboard/${courseId}/quizzes`;
  const guideNewHref = `/dashboard/${courseId}/guide/new${
    scopedId ? `?scope=${encodeURIComponent(scopedId)}` : ""
  }`;

  function resetTaking() {
    setPhase("take");
    setCurrentIdx(0);
    setAnswers({});
    setChecked({});
  }

  async function handleGenerate() {
    const num = parseInt(countInput, 10);
    setModalOpen(false);
    setGenError("");
    setGenState("streaming");
    setGenCount(num);
    setRawContent("");
    setStreamedQuestions([]);
    resetTaking();
    let acc = "";
    try {
      for await (const chunk of streamQuiz(
        courseId,
        scopedId ?? undefined,
        num,
        difficultyInput
      )) {
        acc += chunk;
        setRawContent(acc);
        // Parse complete question blocks (each block ends with "\n---\n") so
        // question 1 is answerable while the rest still stream.
        const lastSep = acc.lastIndexOf("\n---\n");
        if (lastSep !== -1) {
          const parsed = parseQuizMarkdown(acc.slice(0, lastSep + 5));
          if (parsed.length > 0) setStreamedQuestions(parsed);
        }
      }
      // Stream complete — parse the full content.
      const finalQuestions = parseQuizMarkdown(acc);
      if (finalQuestions.length === 0) {
        // Generation ran but produced no usable questions (e.g. strict-mode
        // over garbled/limited materials). Surface honestly, not an empty quiz.
        setGenState("idle");
        setRawContent("");
        setStreamedQuestions([]);
        setGenError(NO_USABLE_MATERIALS_MESSAGE);
        return;
      }
      setStreamedQuestions(finalQuestions);
      setGenState("done");
    } catch (err) {
      setGenState("idle");
      setRawContent("");
      setStreamedQuestions([]);
      setGenError(err instanceof Error ? err.message : "Failed to generate quiz.");
    }
  }

  function openSaveModal(exitAfter: boolean) {
    exitAfterSaveRef.current = exitAfter;
    setSaveTitle((`${scopeName} quiz` || "Practice quiz").slice(0, 60));
    setSaveModalOpen(true);
  }

  async function handleSave() {
    const title = saveTitle.trim();
    if (!title || !rawContent || saving) return;
    setSaving(true);
    try {
      const saved = await saveQuiz(courseId, title, rawContent);
      addToast("Quiz saved!", "success");
      if (exitAfterSaveRef.current) {
        router.push(quizzesHref);
        return;
      }
      setSavedId(saved.id);
      setSaveModalOpen(false);
      // Point the URL at the saved quiz without remounting (a remount would
      // drop the in-memory answers behind the results screen).
      window.history.replaceState(null, "", `/dashboard/${courseId}/quiz/${saved.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save quiz.";
      addToast(/limit/i.test(msg) ? "Delete a saved quiz to save a new one." : msg, "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Derived view state ──
  const title = isNew
    ? genState === "idle" && !streaming
      ? "New quiz"
      : `${scopeName} quiz`
    : savedRow?.title || "Untitled quiz";
  const current = questions[currentIdx];
  const isChecked = !!checked[currentIdx];
  const selected = answers[currentIdx] ?? null;
  const isLast = currentIdx === questions.length - 1;
  // While streaming, the strip is sized by the requested count; strict-mode
  // scoped generation may honestly deliver fewer, so the final total is the
  // parsed length.
  const totalForStrip = streaming ? Math.max(genCount, questions.length) : questions.length;
  const taking = phase === "take" && questions.length > 0 && !loadError && !genError;
  const emptySavedQuiz = !isNew && !loading && !loadError && savedQuestions.length === 0;

  return (
    <div className="flex h-screen overflow-hidden bg-page text-ink max-md:h-dvh max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      <WorkspaceRail activeView="quizzes" onNavigate={navTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar
          course={{ name: course?.name ?? "…", materialCount }}
          tree={tree}
          scopedNodeId={scopedId}
          onScopeChange={setScopedId}
          onUpload={() => router.push(`/dashboard/${courseId}/materials`)}
        />

        {/* Top strip: breadcrumb + surface actions. Divider is full-bleed; its
            content is centered to the shared column so its edges line up with
            the question and option cards below. */}
        <div className="border-b border-rule-soft">
          <div className={`${TAKE_COLUMN} flex items-center gap-3 py-4`}>
            <nav className="flex min-w-0 items-center gap-2 font-sans text-ui-s text-ink-faint">
              <button
                onClick={() => router.push(quizzesHref)}
                className="cursor-pointer whitespace-nowrap hover:text-ink-soft"
              >
                Quizzes
              </button>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate font-medium text-ink-soft">{title}</span>
            </nav>
            <div className="flex-1" />
            {isNew && genState === "done" && !savedId && phase === "take" && (
              <Button variant="ghost" onClick={() => openSaveModal(true)}>
                Save &amp; exit
              </Button>
            )}
          </div>
        </div>

        {/* Quiz progress strip — done / current / remaining segments + scope.
            Same centered column as the question below, so the strip and the
            option cards share left/right edges (one composition). */}
        {taking && (
          <div className="shrink-0 border-b border-rule-soft">
            <div className={`${TAKE_COLUMN} flex items-center gap-4 py-4`}>
              <span className="font-sans text-ui-s font-medium whitespace-nowrap text-ink-faint">
                <b className="font-semibold text-ink">{Math.min(currentIdx + 1, totalForStrip)}</b> /{" "}
                {totalForStrip}
              </span>
              <SegmentedProgress
                total={totalForStrip}
                current={Math.min(currentIdx + 1, totalForStrip)}
                className="flex-1"
              />
              {isNew && scopeName && (
                <span className="hidden font-sans text-ui-s whitespace-nowrap text-ink-faint sm:inline">
                  from <b className="font-medium text-accent-deep">{scopeName}</b>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stage */}
        <div className="flex-1 overflow-y-auto">
          <QuizSurfaceBoundary onExit={() => router.push(quizzesHref)}>
            {loading ? (
              <QuizSkeleton />
            ) : loadError ? (
              <div className="mt-24 max-w-md px-10">
                <p className="font-read text-read-s text-ink-soft">{loadError}</p>
                <div className="mt-6">
                  <Button variant="secondary" onClick={() => router.push(quizzesHref)}>
                    Back to quizzes
                  </Button>
                </div>
              </div>
            ) : genError ? (
              <div className="mt-24 max-w-md px-10">
                <p className="font-read text-read-s text-error-deep">{genError}</p>
                <div className="mt-6 flex gap-2">
                  <Button variant="secondary" onClick={() => router.push(quizzesHref)}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(true)}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : emptySavedQuiz ? (
              <div className="mt-24 max-w-md px-10">
                <p className="font-read text-read-s text-ink-soft">
                  This saved quiz couldn&apos;t be read — its questions may be in an
                  unexpected format.
                </p>
                <div className="mt-6">
                  <Button variant="secondary" onClick={() => router.push(quizzesHref)}>
                    Back to quizzes
                  </Button>
                </div>
              </div>
            ) : streaming && questions.length === 0 ? (
              <div className={`${TAKE_COLUMN} pt-16`}>
                <div className="flex items-center gap-3 py-4 font-sans text-ui text-ink-faint">
                  <span className="flex gap-1">
                    <Dot delay="0ms" />
                    <Dot delay="160ms" />
                    <Dot delay="320ms" />
                  </span>
                  <span>{GENERATING_MESSAGES[statusIdx]}</span>
                </div>
              </div>
            ) : phase === "results" ? (
              <QuizResults
                questions={questions}
                answers={answers}
                scopeName={scopeName}
                guideNewHref={guideNewHref}
                onRetake={resetTaking}
                canSave={isNew}
                saved={savedId != null}
                onSave={() => openSaveModal(false)}
              />
            ) : current ? (
              <div className={`${TAKE_COLUMN} pt-11 pb-20`}>
                <QuizQuestionCard
                  question={current}
                  number={currentIdx + 1}
                  selected={selected}
                  resolved={isChecked}
                  onSelect={(letter) => {
                    if (!isChecked) setAnswers((a) => ({ ...a, [currentIdx]: letter }));
                  }}
                />

                <div className="mt-7 flex items-center gap-3">
                  <span className="font-sans text-ui-s text-ink-faint">
                    {!isChecked
                      ? "Select an answer to see the explanation"
                      : streaming && isLast
                        ? `Generating the next question… (${questions.length} of ${genCount} ready)`
                        : ""}
                  </span>
                  <div className="flex-1" />
                  {!isChecked ? (
                    <Button
                      variant="primary"
                      disabled={!selected}
                      onClick={() => setChecked((c) => ({ ...c, [currentIdx]: true }))}
                    >
                      Check answer
                    </Button>
                  ) : !isLast ? (
                    <Button variant="primary" onClick={() => setCurrentIdx((i) => i + 1)}>
                      Next question <ArrowRight />
                    </Button>
                  ) : streaming ? (
                    <Button variant="primary" disabled>
                      Next question <ArrowRight />
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => setPhase("results")}>
                      See results
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </QuizSurfaceBoundary>
        </div>
      </div>

      {/* Generation modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          onClick={() =>
            isNew && genState === "idle" && !rawContent
              ? router.push(quizzesHref)
              : setModalOpen(false)
          }
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl border border-rule bg-raised p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Generate quiz"
          >
            <div className="mb-2.5 font-sans text-eyebrow font-semibold uppercase tracking-[0.09em] text-accent-deep">
              New quiz
            </div>
            <h2 className="font-display text-display-s text-ink">Generate a quiz</h2>
            <p className="mt-1 mb-5 font-read text-read-s text-ink-soft">
              Questions are drawn only from the materials you scope below.
            </p>

            <div className="space-y-5">
              <div>
                <div className="mb-2 font-sans text-ui-s font-medium text-ink-soft">
                  Number of questions
                </div>
                <SegmentedToggle
                  aria-label="Number of questions"
                  options={COUNT_OPTIONS.map((v) => ({ value: v, label: v }))}
                  value={countInput}
                  onChange={setCountInput}
                />
              </div>

              <div>
                <div className="mb-2 font-sans text-ui-s font-medium text-ink-soft">
                  Difficulty
                </div>
                <SegmentedToggle
                  aria-label="Difficulty"
                  options={[...DIFFICULTY_OPTIONS]}
                  value={difficultyInput}
                  onChange={setDifficultyInput}
                />
              </div>

              {tree.length > 0 && (
                <div>
                  <div className="mb-2 font-sans text-ui-s font-medium text-ink-soft">
                    Source materials
                  </div>
                  <ScopePicker
                    courseName={course?.name ?? "This course"}
                    tree={tree}
                    scopedNodeId={scopedId}
                    onScopeChange={setScopedId}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  isNew && genState === "idle" && !rawContent
                    ? router.push(quizzesHref)
                    : setModalOpen(false)
                }
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGenerate}>
                Generate quiz
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save modal (new quizzes only — saved rows already have a title) */}
      {saveModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          onClick={() => setSaveModalOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl border border-rule bg-raised p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Save quiz"
          >
            <h2 className="font-display text-display-s text-ink">Save quiz</h2>
            <p className="mt-1 mb-5 font-read text-read-s text-ink-soft">
              Give this quiz a title so you can find it later.
            </p>
            <Input
              label="Quiz title"
              autoFocus
              value={saveTitle}
              maxLength={60}
              counter={`${saveTitle.length}/60`}
              placeholder="e.g. Chapter 5 practice quiz"
              onChange={(e) => setSaveTitle(e.target.value.slice(0, 60))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && saveTitle.trim()) handleSave();
              }}
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSaveModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!saveTitle.trim() || saving}>
                {saving ? "Saving…" : "Save quiz"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className={`${TAKE_COLUMN} pt-11 pb-20`}>
      <div className="mb-5 h-3 w-24 rounded bg-sunk" />
      <div className="mb-3 h-7 w-11/12 rounded bg-sunk" />
      <div className="mb-8 h-7 w-2/3 rounded bg-sunk" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[58px] rounded-lg bg-sunk" />
        ))}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="typing-dot" style={{ animationDelay: delay }} />;
}
