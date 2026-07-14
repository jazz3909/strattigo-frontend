"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ChevronRight } from "lucide-react";

import { WorkspaceRail, type RailView } from "@/components/shell/workspace-rail";
import { WorkspaceTopBar } from "@/components/shell/workspace-top-bar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ScopePicker } from "@/components/ui/scope-picker";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";

import { GuideMarkdown } from "@/app/components/ui/GuideMarkdown";
import { useToast } from "@/app/providers/ToastProvider";
import {
  getCourse,
  getCollections,
  getMaterials,
  getSavedStudyGuides,
  streamStudyGuide,
  saveStudyGuide,
  type Course,
  type Collection,
  type StudyGuideSaved,
} from "@/app/lib/api";
import { buildCollectionTree, findNode } from "@/app/lib/collectionTree";

// Honest message when generation yields nothing usable (mirrors the course page).
const NO_USABLE_MATERIALS_MESSAGE =
  "We couldn't generate this from the selected materials. The materials in this collection may be too limited, or a file may not have processed correctly (e.g. a scanned or formula-heavy PDF). Try adding more materials or re-uploading.";

// Cycling status lines shown while the guide streams (presentation only).
const GENERATING_MESSAGES = [
  "Reading your materials…",
  "Finding the throughline…",
  "Drafting the sections…",
  "Setting the key ideas…",
  "Polishing the prose…",
];

type GuideStyle = "detailed" | "bullet";

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function GuidePage({
  params,
}: {
  params: Promise<{ courseId: string; guideId: string }>;
}) {
  const { courseId, guideId } = use(params);
  const isNew = guideId === "new";
  const router = useRouter();
  const { addToast } = useToast();

  // ── Workspace-frame data (course identity + scope tree) ──
  const [course, setCourse] = useState<Course | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [materialCount, setMaterialCount] = useState(0);
  const [scopedId, setScopedId] = useState<string | null>(null);

  // ── The guide being read (saved mode) ──
  const [guide, setGuide] = useState<StudyGuideSaved | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Generation (new mode) ──
  const [modalOpen, setModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [styleInput, setStyleInput] = useState<GuideStyle>("detailed");
  const [focusTopics, setFocusTopics] = useState("");
  const [streamContent, setStreamContent] = useState("");
  const [genState, setGenState] = useState<"idle" | "streaming" | "done">("idle");
  const [genError, setGenError] = useState("");
  const [saving, setSaving] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genStyle, setGenStyle] = useState<GuideStyle>("detailed");
  const [genFocus, setGenFocus] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);

  // ── Reading affordances ──
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);

  const tree = useMemo(() => buildCollectionTree(collections), [collections]);
  const scopeName =
    (scopedId != null && findNode(tree, scopedId)?.name) || course?.name || "";

  // Load the workspace frame + (saved mode) the guide itself. There is no
  // single-guide endpoint — the real mechanism is to list the course's guides
  // and find this id.
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
          const guides = await getSavedStudyGuides(courseId);
          if (cancelled) return;
          const found = guides.find((g) => g.id === guideId);
          if (!found) {
            setLoadError("This study guide could not be found. It may have been deleted.");
          } else {
            setGuide(found);
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
  }, [courseId, guideId, isNew]);

  // In new mode, open the generation modal once the frame is ready — exactly
  // once, so a generation error (which returns to the idle state) surfaces its
  // own retry screen instead of silently reopening the modal.
  useEffect(() => {
    if (isNew && !loading && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setModalOpen(true);
    }
  }, [isNew, loading]);

  // Cycle the status line while streaming.
  useEffect(() => {
    if (genState !== "streaming") return;
    const t = setInterval(
      () => setStatusIdx((i) => (i + 1) % GENERATING_MESSAGES.length),
      2600
    );
    return () => clearInterval(t);
  }, [genState]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
  }, []);

  function navTab(view: RailView) {
    switch (view) {
      case "courses":
        router.push("/dashboard");
        break;
      case "chat":
        router.push(`/dashboard/${courseId}?tab=chat`);
        break;
      case "guides":
        router.push(`/dashboard/${courseId}?tab=study-guide`);
        break;
      case "quizzes":
        router.push(`/dashboard/${courseId}?tab=quiz`);
        break;
      case "materials":
        router.push(`/dashboard/${courseId}?tab=materials`);
        break;
      case "settings":
        router.push("/settings/canvas");
        break;
    }
  }

  const guidesHref = `/dashboard/${courseId}?tab=study-guide`;

  async function handleGenerate() {
    const title = titleInput.trim();
    if (!title) return;
    setModalOpen(false);
    setGenError("");
    setStreamContent("");
    setGenState("streaming");
    setGenTitle(title);
    setGenStyle(styleInput);
    setGenFocus(focusTopics.trim());
    try {
      let acc = "";
      for await (const chunk of streamStudyGuide(
        courseId,
        title,
        scopedId ?? undefined,
        focusTopics,
        styleInput
      )) {
        acc += chunk;
        setStreamContent((prev) => prev + chunk);
      }
      if (!acc.trim()) {
        setGenState("idle");
        setStreamContent("");
        setGenError(NO_USABLE_MATERIALS_MESSAGE);
        return;
      }
      setGenState("done");
    } catch (err) {
      setGenState("idle");
      setStreamContent("");
      setGenError(err instanceof Error ? err.message : "Failed to generate study guide.");
    }
  }

  async function handleSave() {
    if (genState !== "done" || !streamContent.trim()) return;
    setSaving(true);
    try {
      const saved = await saveStudyGuide(courseId, genTitle, streamContent);
      addToast("Study guide saved!", "success");
      router.replace(`/dashboard/${courseId}/guide/${saved.id}`);
    } catch (err) {
      setSaving(false);
      addToast(err instanceof Error ? err.message : "Failed to save study guide.", "error");
    }
  }

  function handleDiscard() {
    router.push(guidesHref);
  }

  // What the document currently shows: the saved guide, or the live stream.
  const streaming = genState === "streaming";
  const showingGenerated = isNew && (streaming || genState === "done");
  const title = showingGenerated ? genTitle : guide?.title || "Untitled guide";
  const content = showingGenerated ? streamContent : guide?.content ?? "";
  const activeStyle: GuideStyle | null = showingGenerated ? genStyle : null;
  const activeFocus = showingGenerated ? genFocus : "";
  const savedDate = guide?.created_at
    ? new Date(guide.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function handleExport() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "study-guide").replace(/[^\w.-]+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-page text-ink">
      <WorkspaceRail activeView="guides" onNavigate={navTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar
          course={{ name: course?.name ?? "…", materialCount }}
          tree={tree}
          scopedNodeId={scopedId}
          onScopeChange={setScopedId}
          onUpload={() => router.push(`/dashboard/${courseId}?tab=materials`)}
        />

        {/* Reading-progress bar under the top bar */}
        <div className="h-[2px] w-full shrink-0 bg-rule-soft">
          <div
            className="h-full bg-accent transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* Top strip: breadcrumb + reading actions */}
        <div className="flex items-center gap-3 border-b border-rule-soft px-14 py-4">
          <nav className="flex min-w-0 items-center gap-2 font-sans text-ui-s text-ink-faint">
            <button
              onClick={() => router.push(guidesHref)}
              className="cursor-pointer whitespace-nowrap hover:text-ink-soft"
            >
              Study guides
            </button>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate font-medium text-ink-soft">
              {isNew && !showingGenerated ? "New guide" : title}
            </span>
          </nav>
          <div className="flex-1" />

          {isNew && genState === "done" ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleDiscard} disabled={saving}>
                Discard
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save guide"}
              </Button>
            </div>
          ) : content ? (
            <div className="flex items-center gap-2">
              <span className="hidden font-sans text-ui-s text-ink-faint sm:inline">
                {readingTime(content)} min read
              </span>
              <Button variant="ghost" onClick={handleExport}>
                <ArrowDownToLine /> Export
              </Button>
            </div>
          ) : null}
        </div>

        {/* Scroll region → the document. The article is left-anchored (a document
            reads anchored-left, not floating centered): the ~660px measure sits
            at the breadcrumb's left margin, whitespace falling to the right. */}
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
          {loading ? (
            <DocumentSkeleton />
          ) : loadError ? (
            <div className="mt-24 max-w-md px-14">
              <p className="font-read text-read text-ink-soft">{loadError}</p>
              <div className="mt-6">
                <Button variant="secondary" onClick={() => router.push(guidesHref)}>
                  Back to study guides
                </Button>
              </div>
            </div>
          ) : genError ? (
            <div className="mt-24 max-w-md px-14">
              <p className="font-read text-read-s text-error-deep">{genError}</p>
              <div className="mt-6 flex gap-2">
                <Button variant="secondary" onClick={() => router.push(guidesHref)}>
                  Back
                </Button>
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <article
              data-density="document"
              className="w-full px-14 pt-14 pb-32"
            >
              <div className="mb-[18px] font-sans text-eyebrow font-semibold uppercase tracking-[0.09em] text-accent-deep">
                Study guide{scopeName ? ` · ${scopeName}` : ""}
              </div>
              <h1 className="mb-5 font-display text-[40px] font-semibold leading-[1.12] tracking-[-0.012em] text-ink">
                {title}
              </h1>
              {activeFocus && (
                <p className="mb-6 font-read text-[18px] leading-[1.55] text-ink-soft">
                  {activeFocus}
                </p>
              )}
              <div className="mb-11 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-b border-rule pb-[30px] font-sans text-ui-s text-ink-faint">
                {activeStyle && (
                  <>
                    <span>{activeStyle === "detailed" ? "Detailed" : "Bullet"} style</span>
                    <BylineDot />
                  </>
                )}
                {scopeName && (
                  <>
                    <span>Scoped to {scopeName}</span>
                    <BylineDot />
                  </>
                )}
                {content && <span>{readingTime(content)} min read</span>}
                {savedDate && (
                  <>
                    <BylineDot />
                    <span>Saved {savedDate}</span>
                  </>
                )}
                {streaming && (
                  <>
                    <BylineDot />
                    <span className="text-accent-deep">Generating…</span>
                  </>
                )}
              </div>

              {content ? (
                <>
                  <GuideMarkdown content={content} />
                  {streaming && <span className="streaming-cursor text-accent" />}
                </>
              ) : streaming ? (
                <div className="flex items-center gap-3 py-4 font-sans text-ui text-ink-faint">
                  <span className="flex gap-1">
                    <Dot delay="0ms" />
                    <Dot delay="160ms" />
                    <Dot delay="320ms" />
                  </span>
                  <span>{GENERATING_MESSAGES[statusIdx]}</span>
                </div>
              ) : null}
            </article>
          )}
        </div>
      </div>

      {/* Generation modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          onClick={() => (isNew && genState === "idle" && !streamContent ? router.push(guidesHref) : setModalOpen(false))}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl border border-rule bg-raised p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Generate study guide"
          >
            <h2 className="font-display text-display-s text-ink">Generate study guide</h2>
            <p className="mt-1 mb-5 font-read text-read-s text-ink-soft">
              Set the title and depth, then scope the source materials with the picker.
            </p>

            <div className="space-y-5">
              <Input
                label="Guide title"
                autoFocus
                value={titleInput}
                maxLength={60}
                counter={`${titleInput.length}/60`}
                placeholder="e.g. Chapter 5 — Organic Chemistry"
                onChange={(e) => setTitleInput(e.target.value.slice(0, 60))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && titleInput.trim()) handleGenerate();
                }}
              />

              <div>
                <div className="mb-2 font-sans text-ui-s font-medium text-ink-soft">Style</div>
                <SegmentedToggle
                  aria-label="Guide style"
                  options={[
                    { value: "detailed", label: "Detailed" },
                    { value: "bullet", label: "Bullet points" },
                  ]}
                  value={styleInput}
                  onChange={setStyleInput}
                />
              </div>

              <Textarea
                label={
                  <>
                    Focus topics <span className="font-normal text-ink-faint">· optional</span>
                  </>
                }
                rows={3}
                value={focusTopics}
                maxLength={500}
                placeholder="e.g. Integration by parts, L'Hôpital's rule, Chapter 5 only…"
                onChange={(e) => setFocusTopics(e.target.value.slice(0, 500))}
              />

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
                  isNew && genState === "idle" && !streamContent
                    ? router.push(guidesHref)
                    : setModalOpen(false)
                }
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGenerate} disabled={!titleInput.trim()}>
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BylineDot() {
  return <span aria-hidden="true" className="size-[3px] rounded-full bg-ink-faint" />;
}

function Dot({ delay }: { delay: string }) {
  return <span className="typing-dot" style={{ animationDelay: delay }} />;
}

function DocumentSkeleton() {
  return (
    <div className="w-full px-14 pt-14 pb-32">
      <div className="mb-5 h-3 w-28 rounded bg-sunk" />
      <div className="mb-4 h-9 w-4/5 rounded bg-sunk" />
      <div className="mb-8 h-4 w-2/3 rounded bg-sunk" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-sunk" style={{ width: `${90 - (i % 3) * 12}%` }} />
        ))}
      </div>
    </div>
  );
}
