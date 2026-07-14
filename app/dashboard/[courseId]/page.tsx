"use client";

import { Component, ReactNode, use, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCourse,
  getMaterials,
  uploadMaterial,
  getSavedStudyGuides,
  getSavedQuizzes,
  deleteSavedQuiz,
  generateStudyGuide,
  deleteStudyGuide,
  streamStudyGuide,
  saveStudyGuide,
  parseQuizMarkdown,
  generateStudyPlan,
  chatWithCourse,
  streamChat,
  getCollections,
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
  Course,
  Material,
  Collection,
  ChatMessage,
  AiResponse,
  StudyGuideSaved,
  QuizSaved,
  StudyEvent,
  FlashcardSet,
  Flashcard,
  getToken,
} from "../../lib/api";
import { buildCollectionTree, findNode, type CollectionNode } from "../../lib/collectionTree";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonStudyGuide, SkeletonText, Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { MarkdownWithMath } from "../../components/ui/MarkdownWithMath";
import { useToast } from "../../providers/ToastProvider";

class QuizErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error: Error) { console.error("Quiz render error:", error); }
  render() {
    if (this.state.crashed) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 text-sm">
          Quiz failed to load — please regenerate.
        </div>
      );
    }
    return this.props.children;
  }
}

// Honest user-facing message when generation yields no usable output — either the
// resolved materials are below the content threshold, or generation ran but
// produced nothing parseable (e.g. strict-mode over a garbled/limited collection).
const NO_USABLE_MATERIALS_MESSAGE =
  "We couldn't generate this from the selected materials. The materials in this collection may be too limited, or a file may not have processed correctly (e.g. a scanned or formula-heavy PDF). Try adding more materials or re-uploading.";

type ActiveTab = "materials" | "study-guide" | "quiz" | "flashcards" | "study-plan" | "chat";

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "materials",
    label: "Materials",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
  {
    id: "study-guide",
    label: "Study Guide",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    id: "study-plan",
    label: "Study Plan",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
];

export default function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Default view is the AI Chat (chat-first layout), unless a ?tab= param asks
  // for a specific tab — used by the study-guide reading view's breadcrumb to
  // return straight to the guides list.
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (
        t === "materials" || t === "study-guide" || t === "quiz" ||
        t === "flashcards" || t === "study-plan" || t === "chat"
      ) {
        return t as ActiveTab;
      }
    }
    return "chat";
  });
  // Presentational-only: controls the hover-expand collapsed sidebar. Not wired to any data logic.
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Materials has moved to its own cream route (/dashboard/[courseId]/materials).
  // Any request for the old in-page Materials tab — a ?tab=materials deep link, or
  // a nav that still sets it — redirects there. The nav onClick pushes directly;
  // this covers the query-param entry point.
  useEffect(() => {
    if (activeTab === "materials") router.replace(`/dashboard/${courseId}/materials`);
  }, [activeTab, courseId, router]);

  // Materials
  // Upload still works from the course-page top-bar button; the materials list
  // itself lives on the /materials route now.
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI content
  const [studyPlan, setStudyPlan] = useState<AiResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [examDate, setExamDate] = useState("");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    loadPage();
  }, [courseId, router]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  async function loadPage() {
    setLoading(true);
    setError("");
    try {
      const [c, m, cols] = await Promise.all([getCourse(courseId), getMaterials(courseId), getCollections(courseId)]);
      setCourse(c);
      setMaterials(m);
      setCollections(cols);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    const isSupported = (f: File) => allowed.includes(f.type) || /\.(pdf|pptx|docx|doc|txt)$/i.test(f.name);

    const accepted: File[] = [];
    const skipped: string[] = []; // "name (reason)" — accumulated across validation AND upload
    for (const f of Array.from(files)) {
      if (isSupported(f)) accepted.push(f);
      else skipped.push(`${f.name} (not a PDF, PPTX, DOCX, or TXT)`);
    }
    const total = files.length;

    if (accepted.length === 0) {
      addToast(`Nothing uploaded — skipped: ${skipped.join("; ")}`, "error", 8000);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Each file uploads sequentially so every one gets its own backend verdict
    // (e.g. a duplicate-name 409 on file 3 must not mask files 4 and 5).
    const uploadedNames: string[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      // Simulate progress within this file's proportional slice of the bar
      const floor = Math.max(Math.round((i / accepted.length) * 100), 5);
      const ceiling = Math.max(Math.round(((i + 1) / accepted.length) * 100) - 5, floor);
      setUploadProgress(floor);
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 5, ceiling));
      }, 300);
      try {
        const material = await uploadMaterial(courseId, file);
        setMaterials((prev) => [material, ...prev]);
        uploadedNames.push(file.name);
      } catch (err: unknown) {
        skipped.push(`${file.name} (${err instanceof Error ? err.message : "upload failed"})`);
      } finally {
        clearInterval(progressInterval);
      }
      setUploadProgress(Math.round(((i + 1) / accepted.length) * 100));
    }

    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Per-file honesty: never report blanket success when anything was skipped.
    if (skipped.length === 0) {
      addToast(
        uploadedNames.length === 1
          ? `"${uploadedNames[0]}" uploaded successfully`
          : `${uploadedNames.length} files uploaded successfully`,
        "success",
      );
    } else if (uploadedNames.length === 0) {
      addToast(`0 of ${total} uploaded — skipped: ${skipped.join("; ")}`, "error", 8000);
    } else {
      addToast(
        `${uploadedNames.length} of ${total} uploaded, ${skipped.length} skipped: ${skipped.join("; ")}`,
        "warning",
        8000,
      );
    }
  }

  function handleStudyGuideTab() {
    setActiveTab("study-guide");
  }

  function handleQuizTab() {
    setActiveTab("quiz");
    // Generation lives at the quiz route (quiz/new) — opening the tab shows
    // the saved-quiz list and never auto-fires generation.
  }

  async function doGenerateStudyPlan(force: boolean) {
    setAiLoading(true);
    setAiError("");
    try {
      const data = await generateStudyPlan(courseId, examDate || undefined, force, selectedCollectionId ?? undefined);
      setStudyPlan(data);
      addToast("Study plan generated!", "success");
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to generate study plan.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleStudyPlanTab() {
    setActiveTab("study-plan");
  }

  async function handleChat(question: string) {
    if (!question.trim()) return;
    const historyToSend = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatInput("");
    setChatLoading(true);

    try {
      let firstChunk = true;
      for await (const chunk of streamChat(courseId, question, historyToSend, selectedCollectionId ?? undefined)) {
        if (firstChunk) {
          firstChunk = false;
          setChatLoading(false);
          setChatStreaming(true);
          setMessages((prev) => [...prev, { role: "assistant", content: chunk }]);
        } else {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
          });
        }
      }
      if (firstChunk) {
        // No chunks received — fall back to non-streaming
        setChatLoading(false);
        setMessages((prev) => [...prev, { role: "assistant", content: "No response received." }]);
      }
    } catch (err: unknown) {
      setChatLoading(false);
      addToast(err instanceof Error ? err.message : "Chat failed.", "error");
    } finally {
      setChatStreaming(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => addToast("Copied to clipboard!", "success"));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <SkeletonStudyGuide />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 border rounded-2xl px-5 py-4" style={{ background: "var(--color-error-bg)", borderColor: "var(--color-error-border)", color: "var(--danger)" }}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span className="flex-1 text-sm">{error}</span>
        <button onClick={loadPage} className="text-sm font-semibold underline">Retry</button>
      </div>
    );
  }

  const hasNoMaterials = materials.length === 0;

  // Explicit salmon literal. globals.css overrides --accent to a grayscale oklch (Ein UI theme),
  // so anything that must read as the brand salmon uses this value directly. --accent-dim and
  // --accent-hover are still genuine salmon tokens and are used as-is.
  const SALMON = "#E19485";

  // Reuse the existing inline TABS icons for the sidebar/nav so no new icon library is introduced.
  const iconFor = (id: ActiveTab) => TABS.find((t) => t.id === id)?.icon;

  // Nav model for the sidebar + mobile bar. Order: AI Chat, Study Guides, Quizzes, Materials.
  // Study Plan and Flashcards are intentionally NOT in the nav (removed from the UI for now) —
  // their components, handlers (handleStudyPlanTab) and conditional renders remain in this file
  // untouched so the views can be re-added to the rail later. Each item reuses the EXISTING view
  // ids and switch handlers. Quiz generation is gated behind the in-tab "Generate Quiz" button —
  // opening the Quizzes view never auto-fires generation.
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { id: "chat", label: "AI Chat", icon: iconFor("chat"), onClick: () => setActiveTab("chat") },
    { id: "study-guide", label: "Study Guides", icon: iconFor("study-guide"), onClick: handleStudyGuideTab },
    { id: "quiz", label: "Quizzes", icon: iconFor("quiz"), onClick: handleQuizTab },
    { id: "materials", label: "Materials", icon: iconFor("materials"), onClick: () => router.push(`/dashboard/${courseId}/materials`) },
  ];

  return (
    <>
      {/* The top-bar Upload button uses a label-wrapped input wired to handleFileUpload,
          so uploads still work from the course page even though the materials list now
          lives on its own /materials route. */}

      {/* ===== ONE FULL-BLEED FROSTED SURFACE ===== */}
      {/* A single translucent glass layer fills the whole workspace below the global navbar. The
          global fixed MeshBackground gradient (position:fixed, 100vw×100vh, zIndex:-1 in
          app/layout.tsx) shows softly through the 0.32 opacity + heavy blur and can never cut off:
          it's pinned to the viewport, and only the MAIN region below scrolls (the shell is
          overflow:hidden), so the gradient stays full-screen at every scroll position and size.
          Everything below sits ON this surface as transparent / barely-tinted sub-regions — there
          are no floating bordered cards at the shell level. */}
      <div
        className="course-shell"
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 56px)", // viewport minus the 56px (h-14) global navbar
          display: "flex",
          flexDirection: "row", // sidebar rail on the far left, full height; top bar + content to its right
          background: "rgba(13,16,24,0.22)",
          backdropFilter: "blur(40px) saturate(120%)",
          WebkitBackdropFilter: "blur(40px) saturate(120%)",
          overflow: "hidden",
        }}
      >
      {/* 64px spacer holds the layout space (full height) so the top bar + content to the right keep a
          constant left edge and do NOT reflow when the sidebar expands. (Desktop only.) */}
      <div className="hidden sm:block" style={{ width: "64px", flexShrink: 0 }} aria-hidden="true" />

      {/* ===== FULL-HEIGHT COLLAPSED HOVER SIDEBAR ===== */}
      {/* Runs the entire shell height on the far left. Absolutely positioned (relative to course-shell)
          so the expansion OVERLAYS the top bar + content instead of pushing them. display is controlled
          by the className (hidden on mobile, flex on >=sm) so it never conflicts with the width animation. */}
      <nav
        className="course-sidebar hidden sm:flex"
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: sidebarExpanded ? "220px" : "64px",
          zIndex: 25,
          // Near-solid dark-navy panel: readability is prioritized over the glass effect for the
          // nav menu, so opacity does the real work regardless of what's behind it. The retained
          // backdrop blur only softens the edges. A slightly brighter right border + soft shadow
          // separate the now-solid rail from the content area as a distinct panel.
          background: sidebarExpanded ? "rgba(13,16,24,0.92)" : "rgba(13,16,24,0.85)",
          backdropFilter: "blur(60px) saturate(120%)",
          WebkitBackdropFilter: "blur(60px) saturate(120%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "2px 0 24px rgba(0,0,0,0.3)",
          transition: "width 240ms cubic-bezier(0.4, 0, 0.2, 1), background 240ms ease",
          overflow: "hidden",
          flexDirection: "column",
          paddingTop: "16px",
          gap: "4px",
        }}
      >
          {/* Back to Courses — top rail item, above Chat. Preserves the old back link's /dashboard href. */}
          <Link
            href="/dashboard"
            aria-label="Back to Courses"
            title="Courses"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              height: "48px",
              margin: "0 8px",
              paddingLeft: "14px",
              paddingRight: "12px",
              borderRadius: "12px",
              textDecoration: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              transition: "background 180ms ease, color 180ms ease",
              width: "calc(100% - 16px)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <span style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </span>
            <span
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: "14px",
                fontWeight: 500,
                opacity: sidebarExpanded ? 1 : 0,
                transition: "opacity 180ms ease",
                transitionDelay: sidebarExpanded ? "60ms" : "0ms",
              }}
            >
              Courses
            </span>
          </Link>
          {/* hairline divider separating the back item from the view nav */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 12px" }} aria-hidden="true" />

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                aria-label={item.label}
                title={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  height: "48px",
                  margin: "0 8px",
                  paddingLeft: "14px",
                  paddingRight: "12px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  background: isActive ? "var(--accent-dim)" : "transparent",
                  color: isActive ? SALMON : "var(--text-secondary)",
                  transition: "background 180ms ease, color 180ms ease",
                  width: "calc(100% - 16px)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                {/* "you are here" left-edge bar */}
                {isActive && (
                  <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: 3, background: SALMON }} />
                )}
                {/* Icon slot — fixed width so the glyph sits at the same x in collapsed and expanded states */}
                <span style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </span>
                {/* Label — clipped while collapsed (overflow:hidden + 64px width), fades in on expand */}
                <span
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 500,
                    opacity: sidebarExpanded ? 1 : 0,
                    transition: "opacity 180ms ease",
                    transitionDelay: sidebarExpanded ? "60ms" : "0ms",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
          {/* FUTURE: chat history / saved conversations slot in here — conversationId state and a
              history list (grouped by recency) would mount in this lower region of the sidebar. */}
        </nav>

      {/* ===== RIGHT COLUMN: top bar + main content ===== (sits to the right of the 64px rail) */}
      <div
        className="course-right"
        style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* ===== TOP BAR ===== (flush on the shell — no background, no card) */}
        <header
          className="course-topbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            padding: "16px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          {/* Left cluster — course identity (back link now lives in the sidebar rail) */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
            <div
              className={`bg-gradient-to-br ${courseGradient(course?.name ?? "")}`}
              style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}
            >
              {course?.name?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: "20px", color: "var(--text-primary)", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {course?.name ?? "Course"}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: SALMON, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {materials.length} material{materials.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Right cluster — universal source selector + Upload (Canvas import lives in Materials view) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {/* "Generate from:" source selector — RELOCATED here from the old chat header. It is the
                universal source selector: bound to the exact same selectedCollectionId state and
                setSelectedCollectionId handler every view reads, so the choice now persists across
                views from one place. Glass-styled to read on the frosted top bar. Hidden until at
                least one collection exists (mirrors the old CollectionSelector's null-return). */}
            {collections.length > 0 && (
              <CollectionScopePicker
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onChange={setSelectedCollectionId}
                variant="topbar"
              />
            )}
            {/* Upload — salmon. Label-wrapped input reuses the existing handleFileUpload. */}
            <label
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: SALMON, color: "#fff", fontWeight: 600, fontSize: "13px", fontFamily: "var(--font-outfit)", borderRadius: "11px", padding: "9px 16px", boxShadow: "0 4px 16px rgba(225,148,133,0.3)", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1, whiteSpace: "nowrap", transition: "background 160ms ease" }}
              onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = SALMON; }}
            >
              <span style={{ fontSize: "15px", lineHeight: 1 }}>↑</span>
              {uploading ? "Uploading…" : "Upload"}
              <input type="file" multiple accept=".pdf,.pptx,.docx,.doc,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
            </label>
          </div>
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main
          className="course-main"
          style={{ flex: 1, minWidth: 0, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          {activeTab === "chat" ? (
            // Chat owns the full main area: a bare full-height flex column, no padding/scroll wrapper,
            // so ChatTab can fill edge-to-edge. NOTE: ChatTab still renders its own bordered card with a
            // fixed height internally (see follow-up flagged in the report) — those internals are
            // protected this round, so this container fills as much as ChatTab's own chrome allows.
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* FUTURE: chat history / saved conversations slot in here — conversationId state and a history list would mount in this region */}
              <ChatTab
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatLoading={chatLoading}
                chatStreaming={chatStreaming}
                onSend={handleChat}
                canChat={!hasNoMaterials}
                chatBottomRef={chatBottomRef}
                chatInputRef={chatInputRef}
              />
            </div>
          ) : (
            // Every other view scrolls inside a padded container — sitting directly on the frosted
            // shell, no outer card of its own. (Longhand padding so the mobile pb-28 bottom-clearance
            // class still applies; desktop sm:pb-8 = the spec'd 32px bottom.)
            <div className="pb-28 sm:pb-8" style={{ flex: 1, overflowY: "auto", paddingTop: 24, paddingLeft: 28, paddingRight: 28 }}>
              {/* ── MATERIALS ── retired: its own cream route now
                  (/dashboard/[courseId]/materials). The redirect effect above
                  sends any ?tab=materials deep link there. ── */}

              {/* ── STUDY GUIDE ── */}
              {activeTab === "study-guide" && (
                <StudyGuideTab
                  courseId={courseId}
                  canGenerate={!hasNoMaterials}
                  collections={collections}
                  selectedCollectionId={selectedCollectionId}
                  onCollectionChange={setSelectedCollectionId}
                />
              )}

              {/* ── QUIZ ── */}
              {activeTab === "quiz" && (
                <QuizErrorBoundary>
                  <QuizTab
                    courseId={courseId}
                    canGenerate={!hasNoMaterials}
                    collections={collections}
                    selectedCollectionId={selectedCollectionId}
                  />
                </QuizErrorBoundary>
              )}

              {/* ── STUDY PLAN ── */}
              {activeTab === "study-plan" && (
                <StudyPlanTab
                  courseId={courseId}
                  selectedCollectionId={selectedCollectionId}
                />
              )}

              {/* ── FLASHCARDS ── */}
              {activeTab === "flashcards" && (
                <FlashcardsTab
                  courseId={courseId}
                  collections={collections}
                  selectedCollectionId={selectedCollectionId}
                  onCollectionChange={setSelectedCollectionId}
                  canGenerate={!hasNoMaterials}
                />
              )}
            </div>
          )}
        </main>
      </div>{/* ===== /course-right ===== */}
      </div>{/* ===== /course-shell ===== */}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      {/* Kept OUTSIDE course-shell: the shell's backdrop-filter creates a containing block, so a
          position:fixed child would be trapped/clipped by its overflow:hidden. Out here it pins to
          the viewport as intended. Hover doesn't exist on touch, so on narrow screens the rail is
          replaced by a bottom icon bar, just above the global dashboard bottom nav (h-16 / 64px). */}
      <nav
        className="course-mobile-nav flex sm:hidden"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "64px",
          zIndex: 35,
          alignItems: "center",
          justifyContent: "space-around",
          gap: "2px",
          padding: "8px 6px",
          background: "rgba(13,16,24,0.85)",
          backdropFilter: "blur(24px) saturate(120%)",
          WebkitBackdropFilter: "blur(24px) saturate(120%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              aria-label={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                flex: 1,
                minWidth: 0,
                minHeight: "44px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: isActive ? SALMON : "var(--text-tertiary)",
                fontFamily: "var(--font-outfit)",
                fontSize: "10px",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: course gradient
// ─────────────────────────────────────────────────────────────────────────────

const COURSE_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-violet-600",
  "from-red-500 to-pink-600",
];

function courseGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  return COURSE_GRADIENTS[Math.abs(h) % COURSE_GRADIENTS.length];
}

function AiErrorBlock({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm text-red-700">{error}</p>
      </div>
      <button onClick={onRetry} className="text-sm font-semibold text-red-700 underline flex-shrink-0">
        Retry
      </button>
    </div>
  );
}

const AI_LOADING_MESSAGES: Record<string, string[]> = {
  "study-guide": [
    "Analyzing your materials...",
    "Identifying key concepts...",
    "Generating your study guide...",
    "Almost done...",
  ],
  "quiz": [
    "Analyzing your materials...",
    "Creating practice questions...",
    "Generating your quiz...",
    "Almost done...",
  ],
  "study-plan": [
    "Analyzing your materials...",
    "Structuring your schedule...",
    "Building your study plan...",
    "Almost done...",
  ],
};

function AiLoadingProgress({ type }: { type: "study-guide" | "quiz" | "study-plan" }) {
  const messages = AI_LOADING_MESSAGES[type];
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, messages.length - 1));
    }, 3000);
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const inc = p < 40 ? 7 : p < 70 ? 4 : 2;
        return Math.min(p + inc + Math.random() * 3, 90);
      });
    }, 700);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [messages.length]);

  return (
    <div className="p-8 sm:p-10" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px' }}>
      <div className="flex flex-col items-center text-center gap-5 max-w-sm mx-auto">
        <div className="relative w-14 h-14">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'var(--accent)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--accent)]" />
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{messages[msgIdx]}</p>
          <p className="text-xs text-[var(--text-tertiary)]">This usually takes 10–30 seconds</p>
        </div>
        <div className="w-full">
          <div className="w-full rounded-full overflow-hidden h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.round(progress)}%`, background: 'var(--accent)' }} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 text-right">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}

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
// STUDY GUIDE TAB
// ─────────────────────────────────────────────────────────────────────────────

function StudyGuideTab({
  courseId,
  canGenerate,
  collections,
  selectedCollectionId,
}: {
  courseId: string;
  canGenerate: boolean;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
}) {
  const { addToast } = useToast();
  const router = useRouter();
  const [guides, setGuides] = useState<StudyGuideSaved[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGuides();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function fetchGuides() {
    setLoadingGuides(true);
    try {
      const data = await getSavedStudyGuides(courseId);
      setGuides(data);
    } catch {
      // Non-fatal — just show empty state
    } finally {
      setLoadingGuides(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteStudyGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
      addToast("Study guide deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const atLimit = guides.length >= 5;
  // Generation + reading now live at their own route. The list navigates instead
  // of expanding in place; the current scope rides along as ?scope= so the
  // reader's ScopePicker opens on the real selected collection.
  const scopeQuery = selectedCollectionId
    ? `?scope=${encodeURIComponent(selectedCollectionId)}`
    : "";

  function goGenerate() {
    if (!canGenerate || atLimit) return;
    router.push(`/dashboard/${courseId}/guide/new${scopeQuery}`);
  }

  function openGuide(id: string) {
    router.push(`/dashboard/${courseId}/guide/${id}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Study Guides</h2>
          {!loadingGuides && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{guides.length} of 5 guides used</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={goGenerate}
            disabled={!canGenerate || atLimit}
            title={atLimit ? "Delete a guide to generate a new one" : undefined}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
          >
            {atLimit ? "Limit Reached" : selectedCollectionId ? `Generate from: ${collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection"}` : "Generate New"}
          </Button>
        </div>
      </div>

      {/* Skeleton loader */}
      {loadingGuides && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Guide list */}
      {!loadingGuides && (
        guides.length === 0 ? (
          <div
            className="flex flex-col items-center text-center animate-fade-in-up"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '48px 32px' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--accent-dim)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5" style={{ fontFamily: 'var(--font-outfit)' }}>
              Generate a study guide
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
              Create a comprehensive study guide from your course materials.
            </p>

            <button
              onClick={goGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2 btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-outfit)', fontWeight: 600, padding: '13px 30px', borderRadius: '14px', fontSize: '0.95rem' }}
              onMouseEnter={(e) => { if (canGenerate) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Study Guide
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideListItem
                key={guide.id}
                guide={guide}
                isDeleting={deletingId === guide.id}
                confirmDelete={confirmDeleteId === guide.id}
                onOpen={() => openGuide(guide.id)}
                onConfirmDelete={() => setConfirmDeleteId(guide.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onDelete={() => handleDelete(guide.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// A saved-guide row that NAVIGATES to the guide's own route (the reading view)
// instead of expanding an accordion in place. Delete stays inline.
function GuideListItem({
  guide,
  isDeleting,
  confirmDelete,
  onOpen,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: {
  guide: StudyGuideSaved;
  isDeleting: boolean;
  confirmDelete: boolean;
  onOpen: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-[14px] border transition-all bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(225,148,133,0.2)]">
      <div className="flex items-center">
        <button
          onClick={onOpen}
          className="flex-1 flex items-center gap-3 px-5 py-4 text-left min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0">
            <svg className="w-[18px] h-[18px] text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{guide.title || "Untitled Guide"}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {new Date(guide.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <svg
            className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] flex-shrink-0 transition-colors"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2 pr-4 pl-2 flex-shrink-0">
          {confirmDelete ? (
            <>
              <span className="text-xs text-[var(--text-secondary)]">Delete?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}
                className="px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onConfirmDelete(); }}
              disabled={isDeleting}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-lg transition-colors disabled:opacity-50"
              aria-label="Delete guide"
            >
              {isDeleting ? (
                <Spinner size="xs" className="border-red-200 border-t-red-500" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<ol><li>$2</li></ol>');
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ TAB
// ─────────────────────────────────────────────────────────────────────────────

function QuizTab({
  courseId,
  canGenerate,
  collections,
  selectedCollectionId,
}: {
  courseId: string;
  canGenerate: boolean;
  collections: Collection[];
  selectedCollectionId: string | null;
}) {
  const { addToast } = useToast();
  const router = useRouter();
  const [savedQuizzes, setSavedQuizzes] = useState<QuizSaved[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedQuizzes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function fetchSavedQuizzes() {
    setLoadingSaved(true);
    try {
      const data = await getSavedQuizzes(courseId);
      setSavedQuizzes(data);
    } catch {
      // Non-fatal — just show empty state
    } finally {
      setLoadingSaved(false);
    }
  }

  async function handleDeleteSavedQuiz(id: string) {
    setDeletingQuizId(id);
    setQuizToDeleteId(null);
    try {
      await deleteSavedQuiz(id);
      setSavedQuizzes((prev) => prev.filter((q) => q.id !== id));
      addToast("Quiz deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingQuizId(null);
    }
  }

  // Generation + taking now live at the quiz's own route. The list navigates
  // instead of expanding in place; the current scope rides along as ?scope= so
  // the quiz view's ScopePicker opens on the real selected collection.
  // Note: saved quizzes store only the questions (no attempt answers/score),
  // so the list shows title/date/question count — see FUTURE-ENHANCEMENTS.md.
  const scopeQuery = selectedCollectionId
    ? `?scope=${encodeURIComponent(selectedCollectionId)}`
    : "";

  function goGenerate() {
    if (!canGenerate) return;
    router.push(`/dashboard/${courseId}/quiz/new${scopeQuery}`);
  }

  function openQuiz(id: string) {
    router.push(`/dashboard/${courseId}/quiz/${id}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Practice Quizzes</h2>
          {!loadingSaved && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{savedQuizzes.length} of 5 saved quizzes used</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={goGenerate}
            disabled={!canGenerate}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
          >
            {selectedCollectionId ? `Generate from: ${collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection"}` : "Generate New"}
          </Button>
        </div>
      </div>

      {/* Skeleton loader */}
      {loadingSaved && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Saved-quiz list */}
      {!loadingSaved && (
        savedQuizzes.length === 0 ? (
          <div
            className="flex flex-col items-center text-center animate-fade-in-up"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '48px 32px' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--accent-dim)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5" style={{ fontFamily: 'var(--font-outfit)' }}>
              Generate a practice quiz
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
              Create a quiz from your course materials to test yourself.
            </p>

            <button
              onClick={goGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2 btn-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-outfit)', fontWeight: 600, padding: '13px 30px', borderRadius: '14px', fontSize: '0.95rem' }}
              onMouseEnter={(e) => { if (canGenerate) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedQuizzes.map((sq) => (
              <QuizListItem
                key={sq.id}
                quiz={sq}
                isDeleting={deletingQuizId === sq.id}
                confirmDelete={quizToDeleteId === sq.id}
                onOpen={() => openQuiz(sq.id)}
                onConfirmDelete={() => setQuizToDeleteId(sq.id)}
                onCancelDelete={() => setQuizToDeleteId(null)}
                onDelete={() => handleDeleteSavedQuiz(sq.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// A saved-quiz row that NAVIGATES to the quiz's own route (take/review view)
// instead of expanding an accordion in place. Delete stays inline.
function QuizListItem({
  quiz: savedQuiz,
  isDeleting,
  confirmDelete,
  onOpen,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: {
  quiz: QuizSaved;
  isDeleting: boolean;
  confirmDelete: boolean;
  onOpen: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const questionCount = useMemo(
    () => parseQuizMarkdown(savedQuiz.content).length,
    [savedQuiz.content]
  );

  return (
    <div className="group rounded-[14px] border transition-all bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(225,148,133,0.2)]">
      <div className="flex items-center">
        <button
          onClick={onOpen}
          className="flex-1 flex items-center gap-3 px-5 py-4 text-left min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0">
            <svg className="w-[18px] h-[18px] text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{savedQuiz.title || "Untitled Quiz"}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {new Date(savedQuiz.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {questionCount > 0 && ` · ${questionCount} questions`}
            </p>
          </div>
          <svg
            className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] flex-shrink-0 transition-colors"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2 pr-4 pl-2 flex-shrink-0">
          {confirmDelete ? (
            <>
              <span className="text-xs text-[var(--text-secondary)]">Delete?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}
                className="px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onConfirmDelete(); }}
              disabled={isDeleting}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Delete quiz"
            >
              {isDeleting ? (
                <Spinner size="xs" className="border-red-200 border-t-red-500" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
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
// CHAT TAB
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Summarize the key concepts",
  "What are the most important formulas?",
  "Quiz me on the hardest topics",
  "What should I focus on for the exam?",
];

function ChatTab({
  messages, chatInput, setChatInput, chatLoading, chatStreaming, onSend, canChat, chatBottomRef, chatInputRef,
}: {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  chatStreaming: boolean;
  onSend: (q: string) => void;
  canChat: boolean;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(chatInput);
    }
  }

  return (
    // Outer container dissolved: transparent, full-height flex column that fills the frosted shell.
    // No bg/border/shadow/rounded, no fixed height — chrome/styling only; all logic below is unchanged.
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", minHeight: 0, background: "transparent", border: "none" }}>
      {/* The old in-view header strip (AI Tutor avatar/label + "Generate from:" selector) was removed.
          The source selector now lives once in the persistent shell top bar (universal across views);
          the chat view starts directly with its message area. */}

      {/* Messages — scrollable region, pinned input below */}
      <div className="space-y-4" style={{ flex: 1, overflowY: "auto", padding: "24px 28px", minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center" style={{ maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-4 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Ask your AI tutor anything</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
              {canChat
                ? "Ask questions about your course materials and get instant answers."
                : "Upload materials first to start chatting."}
            </p>
            {canChat && (
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSend(q)}
                    className="text-xs font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "var(--text-secondary)", cursor: "pointer", transition: "background 160ms ease, border-color 160ms ease, color 160ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(225,148,133,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastAssistant = chatStreaming && i === messages.length - 1 && msg.role === "assistant";
          return (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${msg.role === "assistant" ? "chat-markdown" : ""}`}
                style={{
                  borderRadius: 14,
                  background: msg.role === "user" ? "rgba(225,148,133,0.12)" : "rgba(255,255,255,0.04)",
                  color: "var(--text-primary)",
                }}
              >
                {msg.role === "assistant" ? (
                  <>
                    <MarkdownWithMath content={msg.content} className="text-sm leading-relaxed" />
                    {isLastAssistant && <span className="streaming-cursor" />}
                  </>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold text-xs" style={{ background: "var(--accent-dim)", color: "#E19485" }}>
                  You
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator — only while waiting for first chunk */}
        {chatLoading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="px-4 py-3.5" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14 }}>
              <div className="flex gap-1.5 items-center">
                <div className="typing-dot" style={{ animationDelay: "0ms" }} />
                <div className="typing-dot" style={{ animationDelay: "160ms" }} />
                <div className="typing-dot" style={{ animationDelay: "320ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input — pinned flush at the bottom, full-width */}
      <div style={{ flexShrink: 0, padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Unified input row — the textarea and the send button are DIRECT SIBLINGS in one
            alignItems:center flex container, so they sit on the same line, vertically centered,
            as a single cohesive input bar (no intermediate wrapper offsetting the button). */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#E19485"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(225,148,133,0.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
            placeholder={canChat ? "Ask a question… (Enter to send, Shift+Enter for newline)" : "Upload materials to start chatting"}
            disabled={chatLoading || chatStreaming || !canChat}
            rows={1}
            className="text-sm resize-none max-h-32 focus:outline-none transition-all placeholder:text-[var(--text-secondary)]"
            style={{ flex: 1, minWidth: 0, lineHeight: 1.5, padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "var(--text-primary)" }}
          />
          <button
            onClick={() => onSend(chatInput)}
            disabled={chatLoading || chatStreaming || !chatInput.trim() || !canChat}
            className="btn-press transition-colors disabled:cursor-not-allowed"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: chatInput.trim() && canChat ? "#E19485" : "rgba(255,255,255,0.06)",
              color: chatInput.trim() && canChat ? "#fff" : "var(--text-secondary)",
            }}
          >
            {chatLoading ? (
              <Spinner size="sm" className="border-white/30 border-t-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
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
