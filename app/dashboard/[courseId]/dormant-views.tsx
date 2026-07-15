"use client";

/**
 * DORMANT VIEWS — retained, not routed.
 *
 * The Study Plan and Flashcards views were removed from the course-workspace
 * nav before the ui-rebuild and have NO cream replacement yet. When the dark
 * course workspace was retired (its chat/guides/quizzes/materials tabs all
 * superseded by cream routes), these two views were moved here VERBATIM —
 * together with the CollectionScopePicker their modals depend on — so they can
 * be re-added to the workspace rail later. Nothing imports this file today.
 *
 * Do not delete: dormant, not dead. (Same status as the Canvas import wizard —
 * see app/settings/canvas and app/components/CanvasImportModal.tsx.)
 */

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getStudyEvents,
  createStudyEvent,
  updateStudyEvent,
  deleteStudyEvent,
  getEventPlan,
  streamEventPlan,
  getFlashcardSets,
  getFlashcards,
  deleteFlashcardSet,
  streamGenerateFlashcards,
  Collection,
  StudyEvent,
  FlashcardSet,
  Flashcard,
} from "../../lib/api";
import { buildCollectionTree, findNode, type CollectionNode } from "../../lib/collectionTree";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { MarkdownWithMath } from "../../components/ui/MarkdownWithMath";
import { useToast } from "../../providers/ToastProvider";

// Honest user-facing message when generation yields no usable output — either the
// resolved materials are below the content threshold, or generation ran but
// produced nothing parseable (e.g. strict-mode over a garbled/limited collection).
const NO_USABLE_MATERIALS_MESSAGE =
  "We couldn't generate this from the selected materials. The materials in this collection may be too limited, or a file may not have processed correctly (e.g. a scanned or formula-heavy PDF). Try adding more materials or re-uploading.";

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

// ── Layout constants for the picker's indented rows (a touch tighter than the
//    Materials tree, since the popover is narrower). ──
const SCOPE_INDENT = 15; // extra left-pad per nesting level
const SCOPE_BASE_PAD = 8; // left-pad of a depth-1 row

/** Total number of descendants (children, grandchildren, …) beneath a node. */
function countDescendants(node: CollectionNode): number {
  let n = 0;
  for (const c of node.children) n += 1 + countDescendants(c);
  return n;
}

/**
 * Hierarchical "Generate from" scope picker — a custom dropdown (trigger button +
 * portalled popover) that replaces the old flat <select>. It still resolves to a
 * SINGLE selectedCollectionId (null = "All materials"); the backend already
 * expands a chosen collection to its whole subtree, so picking a parent scopes to
 * that folder + every descendant. The popover mirrors the Materials tree's visual
 * language: salmon folder icons, per-level indentation, and subtle guide lines.
 *
 * The popover is portalled to <body> with fixed positioning so it can never be
 * clipped by an ancestor's `overflow: hidden` (the shell's right column) or a
 * modal panel, and it flips above the trigger when there isn't room below.
 *
 * `variant`:
 *   • "topbar" — the canonical, always-visible selector on the course top bar.
 *     Right-aligned popover; button reads "Generate from: <name>".
 *   • "modal"  — used inside generation modals (where the top bar is unreachable
 *     behind the overlay). Full-width, left-aligned; button shows just <name>.
 */
function CollectionScopePicker({
  collections,
  selectedCollectionId,
  onChange,
  variant = "topbar",
}: {
  collections: Collection[];
  selectedCollectionId: string | null;
  onChange: (id: string | null) => void;
  variant?: "topbar" | "modal";
}) {
  const tree = useMemo(() => buildCollectionTree(collections), [collections]);
  const byId = useMemo(() => {
    const m = new Map<string, Collection>();
    for (const c of collections) m.set(c.id, c);
    return m;
  }, [collections]);
  const selectedNode = useMemo(
    () => (selectedCollectionId ? findNode(tree, selectedCollectionId) : null),
    [tree, selectedCollectionId]
  );
  const descCount = selectedNode ? countDescendants(selectedNode) : 0;

  const [open, setOpen] = useState(false);
  // We track COLLAPSED folders (empty set = fully expanded). Default fully
  // expanded so the whole tree is visible on open — simplest for the common
  // small-tree case — while still letting users collapse big branches.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [popStyle, setPopStyle] = useState<React.CSSProperties | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const isExpanded = (id: string) => !collapsed.has(id);
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Position the portalled popover under (or above) the trigger, flipping when
  // there isn't room below. Recomputed on open, scroll, and resize.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 6;
      const spaceBelow = vh - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, Math.min(380, (openUp ? spaceAbove : spaceBelow) - gap));
      const s: React.CSSProperties = { position: "fixed", maxHeight, zIndex: 70 };
      if (openUp) s.bottom = vh - r.top + gap;
      else s.top = r.bottom + gap;
      if (variant === "modal") {
        s.left = r.left;
        s.width = r.width;
      } else {
        s.right = Math.max(8, vw - r.right);
        s.minWidth = Math.max(248, r.width);
        s.maxWidth = Math.min(360, vw - 16);
      }
      setPopStyle(s);
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, variant]);

  // Close on outside click (trigger + portalled popover both count as "inside")
  // and on Escape. Escape is captured so it closes only the picker, not an
  // enclosing modal that also listens for Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        e.stopPropagation();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  function openMenu() {
    // Force-expand the ancestors of the current selection so it's always visible.
    if (selectedCollectionId) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        let cur = byId.get(selectedCollectionId);
        while (cur && cur.parent_id) {
          next.delete(cur.parent_id);
          cur = byId.get(cur.parent_id);
        }
        return next;
      });
    }
    setOpen(true);
  }

  function choose(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  const triggerName = selectedNode?.name ?? "All materials";

  const folderIcon = (
    <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
  const allIcon = (
    <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
  const check = (
    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );

  // One selectable row (used for both "All materials" and each collection node).
  const optionRow = (opts: {
    id: string | null;
    name: string;
    icon: React.ReactNode;
    depth: number;
    subCount: number;
    hasChildren: boolean;
    expanded: boolean;
  }) => {
    const isSel = opts.id === selectedCollectionId;
    const pad = SCOPE_BASE_PAD + (opts.depth - 1) * SCOPE_INDENT;
    return (
      <div className="flex items-center" style={{ paddingLeft: pad }}>
        {opts.hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(opts.id as string); }}
            className="flex-shrink-0 flex items-center justify-center w-8 h-11 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            style={{ touchAction: "manipulation" }}
            aria-label={opts.expanded ? "Collapse" : "Expand"}
            aria-expanded={opts.expanded}
          >
            <svg className={`w-3 h-3 transition-transform duration-200 ${opts.expanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <span className="flex-shrink-0 w-8" aria-hidden />
        )}
        <button
          type="button"
          role="option"
          aria-selected={isSel}
          onClick={() => choose(opts.id)}
          className={`flex-1 min-w-0 flex items-center gap-2 py-1.5 pl-1.5 pr-2 my-0.5 rounded-lg text-left transition-colors ${isSel ? "bg-[var(--accent-dim)]" : "hover:bg-[rgba(255,255,255,0.05)]"}`}
          style={{ minHeight: 44, touchAction: "manipulation" }}
        >
          <span className="w-7 h-7 rounded-md bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0">
            {opts.icon}
          </span>
          <span className="flex-1 min-w-0 flex items-baseline gap-1.5">
            <span className={`text-[13px] truncate ${isSel ? "font-semibold" : "font-medium"} text-[var(--text-primary)]`}>{opts.name}</span>
            {opts.subCount > 0 && (
              <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0 whitespace-nowrap">{opts.subCount} sub</span>
            )}
          </span>
          {isSel && check}
        </button>
      </div>
    );
  };

  const renderNode = (node: CollectionNode): React.ReactNode => {
    const expanded = isExpanded(node.id);
    const hasChildren = node.children.length > 0;
    const pad = SCOPE_BASE_PAD + (node.depth - 1) * SCOPE_INDENT;
    return (
      <div key={node.id}>
        {optionRow({
          id: node.id,
          name: node.name,
          icon: folderIcon,
          depth: node.depth,
          subCount: node.children.length,
          hasChildren,
          expanded,
        })}
        {hasChildren && expanded && (
          <div className="relative">
            <span aria-hidden className="absolute top-0 bottom-1 w-px bg-[rgba(255,255,255,0.08)]" style={{ left: pad + 13 }} />
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  const triggerBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${open ? "rgba(225,148,133,0.5)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: "10px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-outfit)",
    fontSize: "13px",
    padding: "8px 11px",
    minHeight: 40,
    cursor: "pointer",
    transition: "border-color 160ms ease, background 160ms ease",
    touchAction: "manipulation",
  };
  const triggerStyle: React.CSSProperties =
    variant === "modal"
      ? { ...triggerBase, width: "100%", justifyContent: "flex-start" }
      : { ...triggerBase, maxWidth: 240 };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Generate from: ${triggerName}${descCount > 0 ? `, includes ${descCount} sub-folders` : ""}`}
        style={triggerStyle}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      >
        <span className="flex-shrink-0">{selectedNode ? folderIcon : allIcon}</span>
        <span className="truncate" style={{ flex: 1, textAlign: "left" }}>
          {variant === "topbar" && <span style={{ color: "var(--text-secondary)" }}>Generate from: </span>}
          {triggerName}
        </span>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-secondary)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && popStyle && createPortal(
        <div
          ref={popRef}
          role="listbox"
          aria-label="Generate from source"
          className="flex flex-col animate-scale-in"
          style={{
            ...popStyle,
            background: "rgba(17,24,37,0.97)",
            backdropFilter: "blur(28px) saturate(120%)",
            WebkitBackdropFilter: "blur(28px) saturate(120%)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            overflow: "hidden",
            transformOrigin: "top",
          }}
        >
          <div className="overflow-y-auto px-1.5 py-1.5" style={{ flex: 1, minHeight: 0 }}>
            {optionRow({ id: null, name: "All materials", icon: allIcon, depth: 1, subCount: 0, hasChildren: false, expanded: false })}
            {tree.length > 0 && <div className="my-1 mx-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }} />}
            {tree.map(renderNode)}
          </div>
          {/* Scope hint — makes the "a parent includes its sub-folders" behavior explicit. */}
          <div
            className="flex-shrink-0 px-3 py-2 text-[11px] leading-snug"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "var(--text-tertiary)", background: "rgba(255,255,255,0.02)" }}
          >
            {selectedNode ? (
              descCount > 0 ? (
                <>Generating from <span style={{ color: "var(--accent)", fontWeight: 600 }}>{selectedNode.name}</span> + all {descCount} sub-folder{descCount === 1 ? "" : "s"}</>
              ) : (
                <>Generating from <span style={{ color: "var(--accent)", fontWeight: 600 }}>{selectedNode.name}</span> only</>
              )
            ) : (
              <>Generating from <span style={{ color: "var(--accent)", fontWeight: 600 }}>every material</span> in this course</>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// STUDY PLAN TAB
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STUDY PLAN TAB — Interactive Calendar with Events
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  exam:       { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
  quiz:       { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500" },
  assignment: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500" },
  other:      { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  exam: "Exam", quiz: "Quiz", assignment: "Assignment", other: "Other",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StudyPlanTab({
  courseId,
  selectedCollectionId,
}: {
  courseId: string;
  selectedCollectionId: string | null;
}) {
  const { addToast } = useToast();

  const today = new Date();
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StudyEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addInitialDate, setAddInitialDate] = useState("");
  const [editingEvent, setEditingEvent] = useState<StudyEvent | null>(null);

  // Plan streaming
  const [planContent, setPlanContent] = useState<string>("");
  const [streamingPlan, setStreamingPlan] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(2);

  useEffect(() => {
    loadEvents();
  }, [courseId]);

  useEffect(() => {
    if (selectedEvent) {
      // Load saved plan
      setPlanContent("");
      getEventPlan(selectedEvent.id).then((r) => {
        if (r.content) setPlanContent(r.content);
      });
    }
  }, [selectedEvent]);

  async function loadEvents() {
    setLoadingEvents(true);
    try {
      const data = await getStudyEvents(courseId);
      setEvents(data);
    } catch {
      addToast("Failed to load events", "error");
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleGeneratePlan() {
    if (!selectedEvent) return;
    setStreamingPlan(true);
    setPlanContent("");
    let acc = "";
    try {
      for await (const chunk of streamEventPlan(selectedEvent.id, hoursPerDay, selectedCollectionId ?? undefined)) {
        acc += chunk;
        setPlanContent(acc);
      }
      if (!acc.trim()) {
        // Generation produced no usable plan. Surface honestly (StudyPlanTab uses
        // toast-based errors) instead of an empty plan + a success toast.
        setPlanContent("");
        addToast(NO_USABLE_MATERIALS_MESSAGE, "error");
        return;
      }
      addToast("Study plan generated!", "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to generate plan", "error");
    } finally {
      setStreamingPlan(false);
    }
  }

  async function handleDeleteEvent(event: StudyEvent) {
    try {
      await deleteStudyEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (selectedEvent?.id === event.id) setSelectedEvent(null);
      addToast("Event deleted", "info");
    } catch {
      addToast("Failed to delete event", "error");
    }
  }

  // Build calendar grid
  const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (calCells.length % 7 !== 0) calCells.push(null);

  function eventsOnDay(day: number): StudyEvent[] {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.event_date === dateStr);
  }

  const monthName = new Date(calMonth.year, calMonth.month).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Study Plan</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Add events, then generate AI study plans for each</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setAddInitialDate(""); setShowAddModal(true); }}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Add Event
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar */}
        <div className="flex-1 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <button
              onClick={() => setCalMonth((m) => {
                const d = new Date(m.year, m.month - 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              className="w-8 h-8 rounded-lg hover:bg-[var(--background)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{monthName}</span>
            <button
              onClick={() => setCalMonth((m) => {
                const d = new Date(m.year, m.month + 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              className="w-8 h-8 rounded-lg hover:bg-[var(--background)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--text-tertiary)]">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loadingEvents ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calCells.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="h-20 border-b border-r border-[var(--border)] last:border-r-0 bg-[var(--background)] opacity-40" />;
                }
                const dayEvents = eventsOnDay(day);
                const isToday = today.getFullYear() === calMonth.year && today.getMonth() === calMonth.month && today.getDate() === day;
                const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                return (
                  <div
                    key={day}
                    onClick={() => { setAddInitialDate(dateStr); setShowAddModal(true); }}
                    className={`h-20 p-1.5 border-b border-r border-[var(--border)] last:border-r-0 cursor-pointer hover:bg-[var(--accent-dim)] transition-colors ${isToday ? "bg-[var(--accent-dim)]" : ""}`}
                    style={{ borderRight: (i + 1) % 7 === 0 ? "none" : undefined }}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--accent)] text-black" : "text-[var(--text-secondary)]"}`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const colors = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.other;
                        return (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate ${colors.bg} ${colors.text} cursor-pointer`}
                          >
                            {ev.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-xs text-[var(--text-tertiary)] pl-1">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Detail Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {selectedEvent ? (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex-1">
              {/* Event header */}
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[selectedEvent.event_type]?.bg} ${EVENT_TYPE_COLORS[selectedEvent.event_type]?.text}`}>
                        {EVENT_TYPE_LABELS[selectedEvent.event_type]}
                      </span>
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] truncate">{selectedEvent.title}</h3>
                    <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                      {new Date(selectedEvent.event_date + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
                    </p>

                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingEvent(selectedEvent); setShowAddModal(true); }}
                      className="w-8 h-8 rounded-lg hover:bg-[var(--background)] flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Generate controls */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span>Hours/day:</span>
                    <select
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Number(e.target.value))}
                      className="px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                    >
                      {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                        <option key={h} value={h}>{h}h</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGeneratePlan}
                    loading={streamingPlan}
                    disabled={streamingPlan}
                  >
                    {planContent ? "Regenerate" : "Generate Plan"}
                  </Button>
                </div>
              </div>

              {/* Plan content */}
              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 480 }}>
                {streamingPlan && !planContent && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Spinner size="md" />
                    <p className="text-sm text-[var(--text-tertiary)]">Generating your plan…</p>
                  </div>
                )}
                {planContent ? (
                  <div className="relative">
                    <MarkdownWithMath
                      content={planContent}
                      className="study-guide-content text-sm text-[var(--text-primary)] leading-relaxed"
                    />
                    {streamingPlan && <span className="streaming-cursor" />}
                  </div>
                ) : !streamingPlan ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <p className="text-sm text-[var(--text-tertiary)]">Click "Generate Plan" to create a day-by-day study schedule for this event</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-dim)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Select an event</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Click an event on the calendar or add a new one</p>
              </div>
            </div>
          )}

          {/* Upcoming events list */}
          {events.length > 0 && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-4">
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">Upcoming</h4>
              <div className="space-y-2">
                {events
                  .filter((e) => e.event_date >= today.toISOString().split("T")[0])
                  .sort((a, b) => a.event_date.localeCompare(b.event_date))
                  .slice(0, 5)
                  .map((ev) => {
                    const colors = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.other;
                    const daysLeft = Math.ceil((new Date(ev.event_date + "T00:00:00").getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${selectedEvent?.id === ev.id ? "bg-[var(--accent-dim)] border border-[var(--accent-dim)]" : "hover:bg-[var(--background)]"}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{ev.title}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `In ${daysLeft} days`}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <StudyEventModal
          courseId={courseId}
          initialDate={addInitialDate}
          editingEvent={editingEvent}
          onSave={async (event) => {
            if (editingEvent) {
              setEvents((prev) => prev.map((e) => e.id === event.id ? event : e));
              setSelectedEvent(event);
            } else {
              setEvents((prev) => [...prev, event]);
              setSelectedEvent(event);
            }
            setShowAddModal(false);
            setEditingEvent(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

function StudyEventModal({
  courseId,
  initialDate,
  editingEvent,
  onSave,
  onClose,
}: {
  courseId: string;
  initialDate: string;
  editingEvent: StudyEvent | null;
  onSave: (event: StudyEvent) => void;
  onClose: () => void;
}) {
  const { addToast } = useToast();
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [eventType, setEventType] = useState<StudyEvent["event_type"]>(editingEvent?.event_type ?? "exam");
  const [eventDate, setEventDate] = useState(editingEvent?.event_date ?? initialDate);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !eventDate) return;
    setSaving(true);
    try {
      let saved: StudyEvent;
      if (editingEvent) {
        saved = await updateStudyEvent(editingEvent.id, { title: title.trim(), event_type: eventType, event_date: eventDate });
      } else {
        saved = await createStudyEvent(courseId, title.trim(), eventType, eventDate);
      }
      onSave(saved);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to save event", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={true} onClose={onClose} size="md" title={editingEvent ? "Edit Event" : "Add Event"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midterm Exam, Chapter 5 Quiz"
              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)] transition-all"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as StudyEvent["event_type"])}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] transition-all cursor-pointer"
              >
                <option value="exam">Exam</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] transition-all"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            disabled={!title.trim() || !eventDate || saving}
            className="flex-1"
          >
            {editingEvent ? "Save Changes" : "Add Event"}
          </Button>
        </div>
    </Modal>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARDS TAB — Browse + Spaced Repetition Study Mode
// ─────────────────────────────────────────────────────────────────────────────

function FlashcardsTab({
  courseId,
  collections,
  selectedCollectionId,
  onCollectionChange,
  canGenerate,
}: {
  courseId: string;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
  canGenerate: boolean;
}) {
  const { addToast } = useToast();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [studySet, setStudySet] = useState<{ set: FlashcardSet; cards: Flashcard[] } | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  useEffect(() => {
    loadSets();
  }, [courseId]);

  async function loadSets() {
    setLoading(true);
    try {
      const data = await getFlashcardSets(courseId);
      setSets(data);
    } catch {
      addToast("Failed to load flashcard sets", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStudy(set: FlashcardSet) {
    try {
      const cards = await getFlashcards(set.id);
      if (cards.length === 0) {
        addToast("No cards in this set", "info");
        return;
      }
      setStudySet({ set, cards });
    } catch {
      addToast("Failed to load cards", "error");
    }
  }

  async function handleDeleteSet(setId: string, title: string) {
    setDeletingSetId(setId);
    try {
      await deleteFlashcardSet(setId);
      setSets((prev) => prev.filter((s) => s.id !== setId));
      addToast(`"${title}" deleted`, "info");
    } catch {
      addToast("Failed to delete set", "error");
    } finally {
      setDeletingSetId(null);
    }
  }

  if (studySet) {
    return (
      <FlashcardStudyMode
        set={studySet.set}
        cards={studySet.cards}
        onExit={() => setStudySet(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Flashcards</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">AI-generated flashcards with spaced repetition</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowGenModal(true)}
            disabled={!canGenerate}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
          >
            Generate Set
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : sets.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
          title="No flashcard sets yet"
          description="Generate flashcards from your course materials using AI."
          action={
            <Button variant="primary" size="md" onClick={() => setShowGenModal(true)} disabled={!canGenerate}
              leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
            >
              Generate Flashcards
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="group bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-5 hover:shadow-md hover:border-[var(--accent-dim)] transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <button
                  onClick={() => handleDeleteSet(set.id, set.title)}
                  disabled={deletingSetId === set.id}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2">{set.title}</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {set.flashcard_count ?? 0} cards · {new Date(set.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStudy(set)}
                className="w-full"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                }
              >
                Study
              </Button>
            </div>
          ))}
        </div>
      )}

      {showGenModal && (
        <FlashcardGenerateModal
          courseId={courseId}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onCollectionChange={onCollectionChange}
          onComplete={() => {
            setShowGenModal(false);
            addToast("Flashcard set saved!", "success");
            loadSets();
          }}
          onClose={() => setShowGenModal(false)}
        />
      )}
    </div>
  );
}

function FlashcardGenerateModal({
  courseId,
  collections,
  selectedCollectionId,
  onCollectionChange,
  onComplete,
  onClose,
}: {
  courseId: string;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setProgress("Analyzing materials…");
    try {
      for await (const chunk of streamGenerateFlashcards(courseId, title.trim(), selectedCollectionId ?? undefined)) {
        try {
          const data = JSON.parse(chunk);
          if (data.set_id) {
            setProgress(`Created ${data.card_count} cards!`);
          } else if (data.error) {
            addToast(data.error, "error");
          } else if (data.chunk) {
            setProgress("Generating flashcards…");
          }
        } catch {
          // chunk is a partial JSON fragment, skip
        }
      }
      // Stream complete — backend has auto-saved the set; notify parent to refresh
      onComplete();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to generate", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Modal open={true} onClose={generating ? () => {} : onClose} size="md" title="Generate Flashcard Set">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Set Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 3 Key Terms"
              disabled={generating}
              className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)] transition-all disabled:opacity-60"
              autoFocus
            />
          </div>
          {collections.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Source</label>
              <CollectionScopePicker
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onChange={onCollectionChange}
                variant="modal"
              />
            </div>
          )}
          {generating && (
            <div className="flex items-center gap-3 bg-[var(--accent-dim)] rounded-xl px-4 py-3">
              <Spinner size="sm" />
              <span className="text-sm text-[var(--accent)] font-medium">{progress}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="ghost" size="md" onClick={onClose} disabled={generating} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            loading={generating}
            disabled={!title.trim() || generating}
            className="flex-1"
            leftIcon={!generating ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            ) : undefined}
          >
            Generate
          </Button>
        </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARD STUDY MODE — 3D Flip + Spaced Repetition
// ─────────────────────────────────────────────────────────────────────────────

function FlashcardStudyMode({
  set,
  cards: initialCards,
  onExit,
}: {
  set: FlashcardSet;
  cards: Flashcard[];
  onExit: () => void;
}) {
  // Deck: cards that still need to be reviewed this session
  const [deck, setDeck] = useState<Flashcard[]>([...initialCards]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ hard: 0, medium: 0, easy: 0 });
  const [complete, setComplete] = useState(false);
  const [totalSeen, setTotalSeen] = useState(0);

  const current = deck[currentIdx];
  const remaining = deck.length - currentIdx;

  function handleFlip() {
    setFlipped((f) => !f);
  }

  function handleRating(rating: "hard" | "medium" | "easy") {
    setSessionStats((s) => ({ ...s, [rating]: s[rating] + 1 }));
    setTotalSeen((n) => n + 1);
    setFlipped(false);

    const newDeck = [...deck];

    if (rating === "hard") {
      // Move current card to the end of remaining deck
      const card = newDeck.splice(currentIdx, 1)[0];
      newDeck.push(card);
      // currentIdx stays the same (next card slides in)
      if (currentIdx >= newDeck.length) {
        setComplete(true);
      }
      setDeck(newDeck);
    } else if (rating === "medium") {
      // Keep in deck but move to 2 positions ahead
      const card = newDeck.splice(currentIdx, 1)[0];
      const insertAt = Math.min(currentIdx + 2, newDeck.length);
      newDeck.splice(insertAt, 0, card);
      if (currentIdx >= newDeck.length) {
        setComplete(true);
      }
      setDeck(newDeck);
    } else {
      // Easy: remove from deck
      newDeck.splice(currentIdx, 1);
      setDeck(newDeck);
      if (newDeck.length === 0 || currentIdx >= newDeck.length) {
        if (newDeck.length === 0) {
          setComplete(true);
        } else {
          setCurrentIdx(Math.max(0, currentIdx - 1));
        }
      }
    }
  }

  if (complete || deck.length === 0) {
    const total = sessionStats.hard + sessionStats.medium + sessionStats.easy;
    const masteredPct = total > 0 ? Math.round((sessionStats.easy / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-1">Session Complete!</h2>
          <p className="text-[var(--text-tertiary)]">{set.title}</p>
        </div>
        <div className="flex gap-4 text-center">
          {[
            { label: "Hard", value: sessionStats.hard, color: "text-red-500" },
            { label: "Medium", value: sessionStats.medium, color: "text-amber-500" },
            { label: "Easy", value: sessionStats.easy, color: "text-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-4">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">{masteredPct}% mastered this session</p>
        <div className="flex gap-3">
          <Button variant="ghost" size="md" onClick={onExit}>Back to Sets</Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setDeck([...initialCards]);
              setCurrentIdx(0);
              setFlipped(false);
              setSessionStats({ hard: 0, medium: 0, easy: 0 });
              setTotalSeen(0);
              setComplete(false);
            }}
          >
            Study Again
          </Button>
        </div>
      </div>
    );
  }

  const progress = Math.round(((initialCards.length - remaining) / initialCards.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {set.title}
        </button>
        <span className="text-sm text-[var(--text-tertiary)]">{remaining} remaining</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--border)] rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--accent)" }}
        />
      </div>

      {/* Card */}
      <div className="flex justify-center">
        <div
          onClick={handleFlip}
          className="relative w-full max-w-xl cursor-pointer"
          style={{ perspective: "1200px" }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: 280,
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center text-center gap-4"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest">Question</span>
              <p className="text-xl font-semibold text-[var(--text-primary)] leading-snug">{current?.front}</p>
              <span className="text-xs text-[var(--text-tertiary)] mt-2">Click to reveal answer</span>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 bg-[var(--surface)] border border-[var(--accent-dim)] rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center text-center gap-4"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Answer</span>
              <p className="text-lg text-[var(--text-primary)] leading-relaxed">{current?.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons — only shown after flip */}
      <div className={`flex gap-3 justify-center transition-all duration-300 ${flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {[
          { rating: "hard" as const, label: "Hard", desc: "Again", color: "border-red-300 text-red-600 hover:bg-red-50" },
          { rating: "medium" as const, label: "Medium", desc: "Almost", color: "border-amber-300 text-amber-600 hover:bg-amber-50" },
          { rating: "easy" as const, label: "Easy", desc: "Got it!", color: "border-emerald-300 text-emerald-600 hover:bg-emerald-50" },
        ].map((r) => (
          <button
            key={r.rating}
            onClick={() => handleRating(r.rating)}
            className={`flex flex-col items-center px-6 py-3 rounded-2xl border-2 font-semibold transition-all btn-press cursor-pointer ${r.color}`}
          >
            <span className="text-sm">{r.label}</span>
            <span className="text-xs font-normal opacity-75">{r.desc}</span>
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 justify-center text-xs text-[var(--text-tertiary)]">
        <span className="text-red-500 font-medium">{sessionStats.hard} Hard</span>
        <span className="text-amber-500 font-medium">{sessionStats.medium} Medium</span>
        <span className="text-emerald-500 font-medium">{sessionStats.easy} Easy</span>
      </div>
    </div>
  );
}

export {
  StudyPlanTab,
  StudyEventModal,
  FlashcardsTab,
  FlashcardGenerateModal,
  FlashcardStudyMode,
  CollectionScopePicker,
};
