"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Plus, Sparkles, Trash2 } from "lucide-react";

import { WorkspaceRail, type RailView } from "@/components/shell/workspace-rail";
import { WorkspaceTopBar } from "@/components/shell/workspace-top-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { useToast } from "@/app/providers/ToastProvider";
import {
  getCourse,
  getCollections,
  getMaterials,
  getSavedStudyGuides,
  deleteStudyGuide,
  type Course,
  type Collection,
  type StudyGuideSaved,
} from "@/app/lib/api";
import { buildCollectionTree } from "@/app/lib/collectionTree";
import { ConfirmScrim } from "../materials/scrim";

// Ported from the monolith StudyGuideTab: 5 saved guides per course.
const GUIDE_LIMIT = 5;

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GuidesPage({
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
  const [guides, setGuides] = useState<StudyGuideSaved[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StudyGuideSaved | null>(null);
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
        getSavedStudyGuides(courseId),
      ]);
      setCourse(c);
      setCollections(cols);
      setMaterialCount(mats.length);
      setGuides(saved);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load study guides.");
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
        break; // already here
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

  const canGenerate = materialCount > 0;
  const atLimit = guides.length >= GUIDE_LIMIT;
  // The current scope rides along as ?scope= so the generation view's
  // ScopePicker opens on the real selected collection.
  const generateHref = `/dashboard/${courseId}/guide/new${
    scopedId ? `?scope=${encodeURIComponent(scopedId)}` : ""
  }`;

  async function handleDelete(guide: StudyGuideSaved) {
    setDeletingId(guide.id);
    try {
      await deleteStudyGuide(guide.id);
      setGuides((prev) => prev.filter((g) => g.id !== guide.id));
      setConfirmDelete(null);
      addToast("Study guide deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-page text-ink max-md:h-dvh max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      <WorkspaceRail activeView="guides" onNavigate={navTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar
          course={{ name: course?.name ?? "…", materialCount }}
          tree={tree}
          scopedNodeId={scopedId}
          onScopeChange={setScopedId}
          onUpload={() => router.push(`/dashboard/${courseId}/materials`)}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] px-10 py-8 max-md:px-4">
            {/* Header: title + usage meta + the view's one primary action */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-display-s text-ink">Study guides</h1>
                {!loading && !loadError && (
                  <p className="mt-1 font-sans text-ui-s text-ink-faint">
                    {guides.length} of {GUIDE_LIMIT} guides used
                  </p>
                )}
              </div>
              <Button
                variant="primary"
                disabled={!canGenerate || atLimit}
                title={atLimit ? "Delete a guide to generate a new one" : undefined}
                onClick={() => router.push(generateHref)}
              >
                <Sparkles />
                {atLimit ? "Limit reached" : "Generate new"}
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
            ) : guides.length === 0 ? (
              <div className="rounded-lg border border-rule bg-raised px-6 py-14 text-center">
                <span className="mx-auto mb-4 grid size-12 place-items-center rounded-[10px] bg-accent-tint text-accent-deep">
                  <FileText className="size-6" />
                </span>
                <h2 className="font-display text-[17px] font-medium text-ink">Generate a study guide</h2>
                <p className="mx-auto mt-1 max-w-sm font-read text-read-s text-ink-soft">
                  Create a comprehensive study guide from your course materials.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button variant="primary" disabled={!canGenerate} onClick={() => router.push(generateHref)}>
                    <Sparkles />
                    Generate study guide
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
                {!atLimit && canGenerate && (
                  <Link
                    href={generateHref}
                    className="flex items-center gap-3.5 border-b border-dashed border-rule px-4 py-3.5 transition-colors hover:bg-accent-tint"
                  >
                    <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-sunk text-ink-soft">
                      <Plus className="size-[19px]" />
                    </span>
                    <span className="font-sans text-ui font-medium text-accent-deep">Generate a new study guide</span>
                  </Link>
                )}
                {guides.map((guide, i) => (
                  <div
                    key={guide.id}
                    className={`group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-sheet ${
                      i === 0 ? "" : "border-t border-rule-soft"
                    }`}
                  >
                    <Link
                      href={`/dashboard/${courseId}/guide/${guide.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3.5"
                    >
                      <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-accent-tint text-accent-deep">
                        <FileText className="size-[19px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-[14.5px] font-medium text-ink">
                          {guide.title || "Untitled Guide"}
                        </span>
                        <span className="mt-0.5 block font-sans text-ui-s text-ink-faint">
                          {shortDate(guide.created_at)}
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      aria-label="Delete guide"
                      title="Delete guide"
                      disabled={deletingId === guide.id}
                      onClick={() => setConfirmDelete(guide)}
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[7px] text-ink-faint opacity-0 transition-all group-hover:opacity-100 max-md:size-10 max-md:opacity-100 hover:bg-error-tint hover:text-error focus-visible:opacity-100 disabled:opacity-50"
                    >
                      {deletingId === guide.id ? <Spinner size="xs" /> : <Trash2 className="size-[17px]" />}
                    </button>
                    <Link
                      href={`/dashboard/${courseId}/guide/${guide.id}`}
                      aria-hidden="true"
                      tabIndex={-1}
                      className="shrink-0 text-ink-faint transition-colors group-hover:text-ink-soft"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete-guide confirm */}
      {confirmDelete && (
        <ConfirmScrim onClose={() => !deletingId && setConfirmDelete(null)} label="Delete study guide">
          <h2 className="font-display text-display-s text-ink">Delete this study guide?</h2>
          <p className="mt-1 mb-5 font-read text-read-s text-ink-soft">
            <span className="font-medium text-ink">{confirmDelete.title || "Untitled Guide"}</span> will be
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
