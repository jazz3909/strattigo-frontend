"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Sparkles, SquareCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { useToast } from "@/app/providers/ToastProvider";
import {
  getSavedQuizzes,
  deleteSavedQuiz,
  parseQuizMarkdown,
  type QuizSaved,
} from "@/app/lib/api";
import { ConfirmScrim } from "../materials/scrim";
import { useWorkspace } from "../workspace-context";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function QuizzesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // ── Workspace-frame data — shared, fetched once by the (workspace) layout ──
  const {
    materialCount,
    scopedId,
    loading: frameLoading,
    error: frameError,
    reloadAll,
  } = useWorkspace();

  // ── The list (surface-specific) ──
  const [quizzes, setQuizzes] = useState<QuizSaved[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<QuizSaved | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loading = frameLoading || listLoading;
  const loadError = frameError || listError;

  const load = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      setQuizzes(await getSavedQuizzes(courseId));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load quizzes.");
    } finally {
      setListLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const canGenerate = materialCount > 0;
  // The current scope rides along as ?scope= so the quiz view's ScopePicker
  // opens on the real selected collection. (Saved quizzes store only the
  // questions — no attempt answers/score — so rows show title/date/count;
  // see FUTURE-ENHANCEMENTS.md.)
  const generateHref = `/dashboard/${courseId}/quiz/new${
    scopedId ? `?scope=${encodeURIComponent(scopedId)}` : ""
  }`;

  async function handleDelete(quiz: QuizSaved) {
    setDeletingId(quiz.id);
    try {
      await deleteSavedQuiz(quiz.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      setConfirmDelete(null);
      addToast("Quiz deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] px-10 py-8 max-md:px-4">
            {/* Header: title + usage meta + the view's one primary action */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-display-s text-ink">Practice quizzes</h1>
                {!loading && !loadError && (
                  <p className="mt-1 font-sans text-ui-s text-ink-faint">
                    {quizzes.length} saved quiz{quizzes.length === 1 ? "" : "zes"}
                  </p>
                )}
              </div>
              <Button variant="primary" disabled={!canGenerate} onClick={() => router.push(generateHref)}>
                <Sparkles />
                Generate new
              </Button>
            </div>

            {loading ? (
              <ListSkeleton />
            ) : loadError ? (
              <div className="max-w-md">
                <p className="font-read text-read-s text-error-deep">{loadError}</p>
                <div className="mt-6">
                  <Button variant="secondary" onClick={() => { reloadAll(); load(); }}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="rounded-lg border border-rule bg-raised px-6 py-14 text-center">
                <span className="mx-auto mb-4 grid size-12 place-items-center rounded-[10px] bg-accent-tint text-accent-deep">
                  <SquareCheck className="size-6" />
                </span>
                <h2 className="font-display text-[17px] font-medium text-ink">Generate a practice quiz</h2>
                <p className="mx-auto mt-1 max-w-sm font-read text-read-s text-ink-soft">
                  Create a quiz from your course materials to test yourself.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button variant="primary" disabled={!canGenerate} onClick={() => router.push(generateHref)}>
                    <Sparkles />
                    Generate quiz
                  </Button>
                </div>
                {!canGenerate && (
                  <p className="mt-3 font-sans text-ui-s text-ink-faint">
                    Upload course materials first to enable generation.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-rule bg-raised">
                {/* "Generate new" entry row — same list, dashed affordance */}
                {canGenerate && (
                  <Link
                    href={generateHref}
                    className="flex items-center gap-3.5 border-b border-dashed border-rule px-4 py-3.5 transition-colors hover:bg-accent-tint"
                  >
                    <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-sunk text-ink-soft">
                      <Plus className="size-[19px]" />
                    </span>
                    <span className="font-sans text-ui font-medium text-accent-deep">Generate a new quiz</span>
                  </Link>
                )}
                {quizzes.map((quiz, i) => (
                  <QuizRow
                    key={quiz.id}
                    quiz={quiz}
                    first={i === 0}
                    courseId={courseId}
                    deleting={deletingId === quiz.id}
                    onRequestDelete={() => setConfirmDelete(quiz)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Delete-quiz confirm */}
      {confirmDelete && (
        <ConfirmScrim onClose={() => !deletingId && setConfirmDelete(null)} label="Delete quiz">
          <h2 className="font-display text-display-s text-ink">Delete this quiz?</h2>
          <p className="mt-1 mb-5 font-read text-read-s text-ink-soft">
            <span className="font-medium text-ink">{confirmDelete.title || "Untitled Quiz"}</span> will be
            permanently deleted. This can’t be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}>
              {deletingId ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </ConfirmScrim>
      )}
    </>
  );
}

// A saved-quiz row that navigates to the quiz's own route (take/review view).
// The question count is parsed from the stored markdown (ported from the
// monolith QuizListItem).
function QuizRow({
  quiz,
  first,
  courseId,
  deleting,
  onRequestDelete,
}: {
  quiz: QuizSaved;
  first: boolean;
  courseId: string;
  deleting: boolean;
  onRequestDelete: () => void;
}) {
  const questionCount = useMemo(() => parseQuizMarkdown(quiz.content).length, [quiz.content]);

  return (
    <div
      className={`group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-sheet ${
        first ? "" : "border-t border-rule-soft"
      }`}
    >
      <Link href={`/dashboard/${courseId}/quiz/${quiz.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-accent-tint text-accent-deep">
          <SquareCheck className="size-[19px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-[14.5px] font-medium text-ink">
            {quiz.title || "Untitled Quiz"}
          </span>
          <span className="mt-0.5 block font-sans text-ui-s text-ink-faint">
            {shortDate(quiz.created_at)}
            {questionCount > 0 && ` · ${questionCount} question${questionCount === 1 ? "" : "s"}`}
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label="Delete quiz"
        title="Delete quiz"
        disabled={deleting}
        onClick={onRequestDelete}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[7px] text-ink-faint opacity-0 transition-all group-hover:opacity-100 max-md:size-10 max-md:opacity-100 hover:bg-error-tint hover:text-error focus-visible:opacity-100 disabled:opacity-50"
      >
        {deleting ? <Spinner size="xs" /> : <Trash2 className="size-[17px]" />}
      </button>
      <Link
        href={`/dashboard/${courseId}/quiz/${quiz.id}`}
        aria-hidden="true"
        tabIndex={-1}
        className="shrink-0 text-ink-faint transition-colors group-hover:text-ink-soft"
      >
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`flex items-center gap-3.5 px-4 py-3.5 ${i ? "border-t border-rule-soft" : ""}`}>
          <div className="skeleton-sheen size-[38px] shrink-0 rounded-[9px] bg-sunk" />
          <div className="flex-1">
            <div className="mb-2 h-3.5 w-2/3 rounded bg-sunk skeleton-sheen" />
            <div className="h-3 w-24 rounded bg-sunk skeleton-sheen" />
          </div>
        </div>
      ))}
    </div>
  );
}
