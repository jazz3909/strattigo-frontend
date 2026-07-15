"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Sparkles, SquareCheck, Trash2 } from "lucide-react";

import { WorkspaceRail, type RailView } from "@/components/shell/workspace-rail";
import { WorkspaceTopBar } from "@/components/shell/workspace-top-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { useToast } from "@/app/providers/ToastProvider";
import {
  getCourse,
  getCollections,
  getMaterials,
  getSavedQuizzes,
  deleteSavedQuiz,
  parseQuizMarkdown,
  type Course,
  type Collection,
  type QuizSaved,
} from "@/app/lib/api";
import { buildCollectionTree } from "@/app/lib/collectionTree";
import { ConfirmScrim } from "../materials/scrim";

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

  // ── Workspace-frame data ──
  const [course, setCourse] = useState<Course | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [materialCount, setMaterialCount] = useState(0);
  const [scopedId, setScopedId] = useState<string | null>(null);

  // ── The list ──
  const [quizzes, setQuizzes] = useState<QuizSaved[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<QuizSaved | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tree = useMemo(() => buildCollectionTree(collections), [collections]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [c, cols, mats, saved] = await Promise.all([
        getCourse(courseId),
        getCollections(courseId),
        getMaterials(courseId).catch(() => []),
        getSavedQuizzes(courseId),
      ]);
      setCourse(c);
      setCollections(cols);
      setMaterialCount(mats.length);
      setQuizzes(saved);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("scope");
      if (q) setScopedId(q);
    }
    load();
  }, [load]);

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
        break; // already here
      case "materials":
        router.push(`/dashboard/${courseId}/materials`);
        break;
      case "settings":
        router.push("/settings/billing");
        break;
    }
  }

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
    <div className="flex h-screen overflow-hidden bg-page text-ink">
      <WorkspaceRail activeView="quizzes" onNavigate={navTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar
          course={{ name: course?.name ?? "…", materialCount }}
          tree={tree}
          scopedNodeId={scopedId}
          onScopeChange={setScopedId}
          onUpload={() => router.push(`/dashboard/${courseId}/materials`)}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] px-10 py-8">
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
                  <Button variant="secondary" onClick={load}>
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
    </div>
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
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[7px] text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-error-tint hover:text-error focus-visible:opacity-100 disabled:opacity-50"
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
          <div className="size-[38px] shrink-0 rounded-[9px] bg-sunk" />
          <div className="flex-1">
            <div className="mb-2 h-3.5 w-2/3 rounded bg-sunk" />
            <div className="h-3 w-24 rounded bg-sunk" />
          </div>
        </div>
      ))}
    </div>
  );
}
