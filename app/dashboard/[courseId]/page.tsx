"use client";

import { Component, ReactNode, use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCourse,
  getMaterials,
  uploadMaterial,
  deleteMaterial,
  getMaterialWithDownload,
  renameMaterial,
  getSavedStudyGuides,
  getSavedQuizzes,
  saveQuiz,
  deleteSavedQuiz,
  generateStudyGuide,
  deleteStudyGuide,
  streamStudyGuide,
  saveStudyGuide,
  generateQuiz,
  streamQuiz,
  parseQuizMarkdown,
  generateStudyPlan,
  chatWithCourse,
  streamChat,
  getCollections,
  createCollection,
  deleteCollection,
  addMaterialToCollection,
  removeMaterialFromCollection,
  getCollectionMaterials,
  getCanvasCourses,
  Course,
  Material,
  Collection,
  ChatMessage,
  AiResponse,
  StudyGuideSaved,
  QuizSaved,
  Quiz,
  type QuizQuestion,
  getToken,
} from "../../lib/api";
import { CanvasImportModal } from "../../components/CanvasImportModal";
import { Button } from "../../components/ui/Button";
import { Tabs } from "../../components/ui/Tabs";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
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

type ActiveTab = "materials" | "study-guide" | "quiz" | "study-plan" | "chat";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("materials");

  // Materials
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI content
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [studyPlan, setStudyPlan] = useState<AiResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [examDate, setExamDate] = useState("");
  const [quizGeneratedAt, setQuizGeneratedAt] = useState<Date | null>(null);

  // Quiz streaming
  const [streamingQuiz, setStreamingQuiz] = useState(false);
  const [rawQuizContent, setRawQuizContent] = useState("");
  const [streamedQuestions, setStreamedQuestions] = useState<QuizQuestion[]>([]);
  const [quizGenerationId, setQuizGenerationId] = useState(0);

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
    const file = files[0];

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|pptx|docx|doc|txt)$/i)) {
      addToast("Please upload a PDF, PPTX, DOCX, or TXT file.", "error");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 85));
    }, 300);

    try {
      const material = await uploadMaterial(courseId, file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
      setMaterials((prev) => [material, ...prev]);
      addToast(`"${file.name}" uploaded successfully`, "success");
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      addToast(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRenameSuccess(id: string, newName: string) {
    setMaterials((prev) => prev.map((m) => m.id === id ? { ...m, file_name: newName } : m));
  }

  async function handleDeleteMaterial(id: string, filename: string) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      addToast(`"${filename}" deleted`, "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleStudyGuideTab() {
    setActiveTab("study-guide");
  }

  async function doGenerateQuiz(force: boolean) {
    setQuizGenerationId((id) => id + 1);
    setStreamingQuiz(true);
    setAiError("");
    setQuiz(null);
    setStreamedQuestions([]);
    setRawQuizContent("");

    let accumulated = "";

    try {
      for await (const chunk of streamQuiz(courseId, selectedCollectionId ?? undefined)) {
        accumulated += chunk;
        setRawQuizContent(accumulated);

        // Parse complete question blocks (each block ends with "\n---\n")
        const lastSep = accumulated.lastIndexOf("\n---\n");
        if (lastSep !== -1) {
          const completeContent = accumulated.slice(0, lastSep + 5);
          const parsed = parseQuizMarkdown(completeContent);
          if (parsed.length > 0) setStreamedQuestions(parsed);
        }
      }

      // Stream complete — parse full content
      const finalQuestions = parseQuizMarkdown(accumulated);
      setQuiz({ questions: finalQuestions });
      setStreamedQuestions(finalQuestions);
      setQuizGeneratedAt(new Date());
      addToast("Quiz generated!", "success");
    } catch {
      // Fallback to non-streaming
      try {
        const data = await generateQuiz(courseId, force, selectedCollectionId ?? undefined);
        setQuiz(data);
        setStreamedQuestions(data.questions);
        setQuizGeneratedAt(new Date());
        addToast("Quiz generated!", "success");
      } catch (fallbackErr: unknown) {
        setAiError(fallbackErr instanceof Error ? fallbackErr.message : "Failed to generate quiz.");
      }
    } finally {
      setStreamingQuiz(false);
    }
  }

  function handleQuizTab() {
    setActiveTab("quiz");
    if (!quiz && !streamingQuiz) doGenerateQuiz(false);
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
    if (!studyPlan) doGenerateStudyPlan(false);
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

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-5">
        <Link href="/dashboard" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Courses
        </Link>
        <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-[var(--text-secondary)] font-medium truncate max-w-[200px]">{course?.name}</span>
      </div>

      {/* Course header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${courseGradient(course?.name ?? "")} flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0`}>
            {course?.name?.[0]?.toUpperCase() ?? "C"}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] leading-tight">{course?.name}</h1>
            {course?.description && (
              <p className="text-sm text-[var(--text-tertiary)] mt-1">{course.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="purple" size="sm" dot>
                {materials.length} material{materials.length !== 1 ? "s" : ""}
              </Badge>
              {hasNoMaterials && (
                <Badge variant="amber" size="sm">
                  Upload materials to unlock AI
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Study Guide",
              icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" /></svg>,
              action: handleStudyGuideTab,
              tab: "study-guide" as ActiveTab,
            },
            {
              label: "Quiz",
              icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
              action: handleQuizTab,
              tab: "quiz" as ActiveTab,
            },
            {
              label: "Study Plan",
              icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
              action: handleStudyPlanTab,
              tab: "study-plan" as ActiveTab,
            },
            {
              label: "Chat",
              icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
              action: () => setActiveTab("chat"),
              tab: "chat" as ActiveTab,
            },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              disabled={aiLoading || (btn.tab !== "chat" && hasNoMaterials)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold
                transition-all duration-150 btn-press cursor-pointer
                ${activeTab === btn.tab ? "shadow-md" : "border"}
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              style={activeTab === btn.tab
                ? { background: "var(--accent)", color: "#0a0a0f" }
                : { borderColor: "var(--accent-dim)", color: "var(--accent)", background: "var(--accent-dim)" }
              }
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* No materials warning */}
      {hasNoMaterials && activeTab !== "materials" && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 border rounded-2xl" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.2)" }}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>No materials uploaded</p>
            <p className="text-xs mt-0.5" style={{ color: "#fbbf24" }}>
              Upload course materials first to use AI features.{" "}
              <button className="underline font-semibold" onClick={() => setActiveTab("materials")}>
                Go to Materials →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as ActiveTab)}
        className="mb-6"
      />

      {/* ── MATERIALS TAB ─────────────────────────────── */}
      {activeTab === "materials" && (
        <MaterialsTab
          courseId={courseId}
          materials={materials}
          uploading={uploading}
          uploadProgress={uploadProgress}
          dragOver={dragOver}
          setDragOver={setDragOver}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          deletingId={deletingId}
          handleDeleteMaterial={handleDeleteMaterial}
          onRenameSuccess={handleRenameSuccess}
          collections={collections}
          onCollectionsChange={setCollections}
          onImportComplete={loadPage}
        />
      )}

      {/* ── STUDY GUIDE TAB ───────────────────────────── */}
      {activeTab === "study-guide" && (
        <StudyGuideTab
          courseId={courseId}
          canGenerate={!hasNoMaterials}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onCollectionChange={setSelectedCollectionId}
        />
      )}


      {/* ── QUIZ TAB ──────────────────────────────────── */}
      {activeTab === "quiz" && (
        <QuizErrorBoundary>
          <QuizTab
            courseId={courseId}
            rawQuizContent={rawQuizContent}
            quiz={quiz}
            loading={streamingQuiz}
            error={aiError}
            generatedAt={quizGeneratedAt}
            onGenerate={() => doGenerateQuiz(false)}
            onRegenerate={() => doGenerateQuiz(true)}
            canGenerate={!hasNoMaterials}
            streamingQuiz={streamingQuiz}
            streamedQuestions={streamedQuestions}
            quizGenerationId={quizGenerationId}
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onCollectionChange={setSelectedCollectionId}
          />
        </QuizErrorBoundary>
      )}

      {/* ── STUDY PLAN TAB ────────────────────────────── */}
      {activeTab === "study-plan" && (
        <StudyPlanTab
          studyPlan={studyPlan}
          loading={aiLoading}
          error={aiError}
          examDate={examDate}
          setExamDate={setExamDate}
          onGenerate={() => doGenerateStudyPlan(false)}
          onRegenerate={() => doGenerateStudyPlan(true)}
          canGenerate={!hasNoMaterials}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onCollectionChange={setSelectedCollectionId}
        />
      )}

      {/* ── CHAT TAB ──────────────────────────────────── */}
      {activeTab === "chat" && (
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
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onCollectionChange={setSelectedCollectionId}
        />
      )}
    </div>
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

function fileIcon(filename: string): { icon: React.ReactNode; color: string } {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") {
    return {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: "bg-red-100 text-red-600",
    };
  }
  if (ext === "pptx" || ext === "ppt") {
    return {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
      color: "bg-orange-100 text-orange-600",
    };
  }
  if (ext === "docx" || ext === "doc") {
    return {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: "bg-blue-100 text-blue-600",
    };
  }
  return {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: "bg-[var(--surface-2)] text-[var(--text-secondary)]",
  };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-8 sm:p-10">
      <div className="flex flex-col items-center text-center gap-5 max-w-sm mx-auto">
        <div className="relative w-14 h-14">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-lg">
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
          <ProgressBar value={Math.round(progress)} size="sm" variant="gradient" animated />
          <p className="text-xs text-[var(--text-tertiary)] mt-2 text-right">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIALS TAB
// ─────────────────────────────────────────────────────────────────────────────

function MaterialsTab({
  courseId, materials, uploading, uploadProgress, dragOver, setDragOver,
  fileInputRef, handleFileUpload, confirmDeleteId, setConfirmDeleteId, deletingId, handleDeleteMaterial,
  onRenameSuccess, collections, onCollectionsChange, onImportComplete,
}: {
  courseId: string;
  materials: Material[];
  uploading: boolean;
  uploadProgress: number;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (files: FileList | null) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  deletingId: string | null;
  handleDeleteMaterial: (id: string, filename: string) => void;
  onRenameSuccess: (id: string, newName: string) => void;
  collections: Collection[];
  onCollectionsChange: (cols: Collection[]) => void;
  onImportComplete: () => void;
}) {
  const { addToast } = useToast();
  const [subTab, setSubTab] = useState<"all" | "collections">("all");
  const [canvasImportOpen, setCanvasImportOpen] = useState(false);
  const [canvasConnected, setCanvasConnected] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Collection state
  const [collectionMaterials, setCollectionMaterials] = useState<Record<string, Material[]>>({});
  const [materialCollectionMap, setMaterialCollectionMap] = useState<Record<string, string[]>>({});
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  const [confirmDeleteCollectionId, setConfirmDeleteCollectionId] = useState<string | null>(null);
  const [addToCollectionPopoverId, setAddToCollectionPopoverId] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const collectionIdString = collections.map((c) => c.id).join(",");

  useEffect(() => {
    getCanvasCourses().then(() => setCanvasConnected(true)).catch(() => setCanvasConnected(false));
  }, []);

  useEffect(() => {
    if (collections.length === 0) {
      setMaterialCollectionMap({});
      setCollectionMaterials({});
      return;
    }
    async function buildMap() {
      const map: Record<string, string[]> = {};
      const colMats: Record<string, Material[]> = {};
      await Promise.all(
        collections.map(async (col) => {
          try {
            const mats = await getCollectionMaterials(col.id);
            colMats[col.id] = mats;
            for (const m of mats) {
              if (!map[m.id]) map[m.id] = [];
              map[m.id].push(col.id);
            }
          } catch {}
        })
      );
      setMaterialCollectionMap(map);
      setCollectionMaterials(colMats);
    }
    buildMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionIdString]);

  async function handleDownload(materialId: string) {
    setDownloadingId(materialId);
    try {
      const data = await getMaterialWithDownload(materialId);
      window.open(data.download_url, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to get download link.", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    setRenameSaving(true);
    try {
      await renameMaterial(id, renameValue.trim());
      onRenameSuccess(id, renameValue.trim());
      setRenamingId(null);
      addToast("File renamed successfully.", "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to rename file.", "error");
    } finally {
      setRenameSaving(false);
    }
  }

  async function handleToggleCollection(materialId: string, collectionId: string) {
    const isIn = (materialCollectionMap[materialId] ?? []).includes(collectionId);
    const key = collectionId + ":" + materialId;
    setTogglingKey(key);
    try {
      if (isIn) {
        await removeMaterialFromCollection(collectionId, materialId);
        setMaterialCollectionMap((prev) => ({ ...prev, [materialId]: (prev[materialId] ?? []).filter((c) => c !== collectionId) }));
        setCollectionMaterials((prev) => ({ ...prev, [collectionId]: (prev[collectionId] ?? []).filter((m) => m.id !== materialId) }));
      } else {
        await addMaterialToCollection(collectionId, materialId);
        setMaterialCollectionMap((prev) => ({ ...prev, [materialId]: [...(prev[materialId] ?? []), collectionId] }));
        const mat = materials.find((m) => m.id === materialId);
        if (mat) setCollectionMaterials((prev) => ({ ...prev, [collectionId]: [...(prev[collectionId] ?? []), mat] }));
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to update collection.", "error");
    } finally {
      setTogglingKey(null);
    }
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    try {
      const col = await createCollection(courseId, newCollectionName.trim());
      onCollectionsChange([...collections, col]);
      setCollectionMaterials((prev) => ({ ...prev, [col.id]: [] }));
      setCreateModalOpen(false);
      setNewCollectionName("");
      addToast(`Collection "${col.name}" created!`, "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to create collection.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCollection(collectionId: string, name: string) {
    setDeletingCollectionId(collectionId);
    setConfirmDeleteCollectionId(null);
    try {
      await deleteCollection(collectionId);
      onCollectionsChange(collections.filter((c) => c.id !== collectionId));
      if (expandedCollectionId === collectionId) setExpandedCollectionId(null);
      setMaterialCollectionMap((prev) => {
        const next = { ...prev };
        for (const matId of Object.keys(next)) next[matId] = (next[matId] ?? []).filter((c) => c !== collectionId);
        return next;
      });
      addToast(`"${name}" deleted`, "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to delete collection.", "error");
    } finally {
      setDeletingCollectionId(null);
    }
  }

  async function handleRemoveFromCollection(collectionId: string, materialId: string) {
    try {
      await removeMaterialFromCollection(collectionId, materialId);
      setCollectionMaterials((prev) => ({ ...prev, [collectionId]: (prev[collectionId] ?? []).filter((m) => m.id !== materialId) }));
      setMaterialCollectionMap((prev) => ({ ...prev, [materialId]: (prev[materialId] ?? []).filter((c) => c !== collectionId) }));
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to remove from collection.", "error");
    }
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-xl mb-5 w-fit">
        <button
          onClick={() => setSubTab("all")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${subTab === "all" ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          All Files
        </button>
        <button
          onClick={() => setSubTab("collections")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${subTab === "collections" ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Collections{collections.length > 0 ? ` (${collections.length})` : ""}
        </button>
      </div>

      {/* ── ALL FILES SUB-TAB ─────────────────────────── */}
      {subTab === "all" && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Course Materials</h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{materials.length} file{materials.length !== 1 ? "s" : ""} uploaded</p>
            </div>
            <div className="flex items-center gap-2">
              {canvasConnected && (
                <button
                  onClick={() => setCanvasImportOpen(true)}
                  className="btn-press flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                  </svg>
                  Import from Canvas
                </button>
              )}
              <label className={`btn-press flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all ${uploading ? "opacity-60 cursor-not-allowed bg-[var(--surface-2)] text-[var(--text-tertiary)]" : "btn-gradient text-white shadow-sm hover:shadow-md"}`}>
                {uploading ? (
                  <><Spinner size="sm" className="border-[var(--border-hover)] border-t-slate-600" /> Uploading…</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload file
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.docx,.doc,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="mb-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-3 mb-3">
                <Spinner size="sm" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Uploading file…</span>
                <span className="text-sm text-[var(--text-tertiary)] ml-auto">{uploadProgress}%</span>
              </div>
              <ProgressBar value={uploadProgress} size="sm" />
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
            className={`mb-5 border-2 border-dashed rounded-2xl transition-all ${dragOver ? "border-[var(--accent)] bg-[var(--accent-dim)] scale-[1.01]" : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[var(--accent-dim)]/30"}`}
          >
            <label className="flex flex-col items-center justify-center py-8 px-4 cursor-pointer">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${dragOver ? "bg-[var(--accent-dim)]" : "bg-[var(--surface)] border border-[var(--border)]"}`}>
                <svg className={`w-6 h-6 ${dragOver ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className={`text-sm font-semibold mb-1 ${dragOver ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>{dragOver ? "Drop to upload" : "Drag & drop files here"}</p>
              <p className="text-xs text-[var(--text-tertiary)]">PDF, PPTX, DOCX, TXT — up to 25MB</p>
              <input type="file" accept=".pdf,.pptx,.docx,.doc,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
            </label>
          </div>

          {materials.length === 0 ? (
            <EmptyState
              icon={<svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>}
              title="No materials yet"
              description="Upload PDFs, PowerPoints, or Word documents to get started with AI features."
              className="py-10"
            />
          ) : (
            <div className="space-y-2">
              {materials.map((m, i) => {
                const icon = fileIcon(m.file_name);
                const isRenaming = renamingId === m.id;
                const matCols = (materialCollectionMap[m.id] ?? []).map((cid) => collections.find((c) => c.id === cid)).filter(Boolean) as Collection[];
                const isPopoverOpen = addToCollectionPopoverId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-4 bg-[var(--surface)] px-5 py-4 rounded-2xl border shadow-sm transition-all group animate-fade-in-up ${isRenaming ? "border-[var(--accent-dim)]" : "border-[var(--border)] hover:shadow-md hover:border-[var(--border)]"}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${icon.color} flex items-center justify-center flex-shrink-0`}>{icon.icon}</div>

                    {isRenaming ? (
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRename(m.id); if (e.key === "Escape") setRenamingId(null); }}
                          className="flex-1 min-w-0 text-sm border border-[var(--border)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)]"
                        />
                        <button onClick={() => handleRename(m.id)} disabled={renameSaving || !renameValue.trim()} className="px-2.5 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)] disabled:opacity-50 transition-colors flex-shrink-0">
                          {renameSaving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => setRenamingId(null)} className="px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors flex-shrink-0">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {m.created_at && new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          {matCols.map((col) => (
                            <span key={col.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-dim)]">
                              {col.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isRenaming && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Add to collection button */}
                        {collections.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => { setAddToCollectionPopoverId(isPopoverOpen ? null : m.id); setConfirmDeleteId(null); }}
                              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all"
                              aria-label="Add to collection"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                            {isPopoverOpen && (
                              <div className="absolute right-0 top-10 z-20 w-56 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-lg p-2 animate-scale-in-fast">
                                <p className="text-xs font-semibold text-[var(--text-secondary)] px-2 py-1.5 border-b border-[var(--border)] mb-1">Add to collection</p>
                                {collections.map((col) => {
                                  const isIn = (materialCollectionMap[m.id] ?? []).includes(col.id);
                                  const isToggling = togglingKey === col.id + ":" + m.id;
                                  return (
                                    <button
                                      key={col.id}
                                      onClick={() => handleToggleCollection(m.id, col.id)}
                                      disabled={isToggling}
                                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--background)] transition-colors text-sm text-left disabled:opacity-50"
                                    >
                                      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isIn ? "bg-[var(--accent)] border-violet-600" : "border-[var(--border-hover)]"}`}>
                                        {isIn && (
                                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                          </svg>
                                        )}
                                      </span>
                                      <span className="flex-1 truncate text-[var(--text-primary)]">{col.name}</span>
                                      {isToggling && <Spinner size="xs" className="border-[var(--border)] border-t-slate-500 flex-shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rename button */}
                        <button
                          onClick={() => { setRenamingId(m.id); setRenameValue(m.file_name); setConfirmDeleteId(null); setAddToCollectionPopoverId(null); }}
                          className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-all"
                          aria-label="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>

                        {/* Download button */}
                        <button
                          onClick={() => handleDownload(m.id)}
                          disabled={downloadingId === m.id}
                          className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                          aria-label="Download"
                        >
                          {downloadingId === m.id ? (
                            <Spinner size="xs" className="border-blue-200 border-t-blue-500" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          )}
                        </button>

                        {/* Delete button */}
                        <div className="relative">
                          <button
                            onClick={() => { setConfirmDeleteId(confirmDeleteId === m.id ? null : m.id); setAddToCollectionPopoverId(null); }}
                            disabled={deletingId === m.id}
                            className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 transition-all"
                            aria-label="Delete"
                          >
                            {deletingId === m.id ? (
                              <Spinner size="xs" className="border-red-200 border-t-red-500" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                          </button>
                          {confirmDeleteId === m.id && (
                            <div className="absolute right-0 top-10 z-10 w-48 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-lg p-3 animate-scale-in-fast">
                              <p className="text-xs text-[var(--text-secondary)] mb-3 font-medium">Delete this file?</p>
                              <div className="flex gap-2">
                                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-1.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)]">Cancel</button>
                                <button onClick={() => handleDeleteMaterial(m.id, m.file_name)} className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── COLLECTIONS SUB-TAB ──────────────────────── */}
      {subTab === "collections" && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Collections</h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Group materials for focused AI generation</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Create Collection
            </Button>
          </div>

          {collections.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              }
              title="No collections yet"
              description="Create a collection to group related files and generate focused AI content from a subset of your materials."
              action={
                <Button variant="primary" size="md" onClick={() => setCreateModalOpen(true)}
                  leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                >
                  Create Collection
                </Button>
              }
            />
          ) : (
            <>
              <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mb-4">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                Add files from the All Files tab using the + button on each file card
              </p>
              <div className="space-y-3">
                {collections.map((col) => {
                  const colMats = collectionMaterials[col.id] ?? [];
                  const isExpanded = expandedCollectionId === col.id;
                  const isDeleting = deletingCollectionId === col.id;
                  const confirmDelete = confirmDeleteCollectionId === col.id;
                  return (
                    <div key={col.id} className={`bg-[var(--surface)] rounded-2xl border shadow-sm transition-all ${isExpanded ? "border-[var(--accent-dim)]" : "border-[var(--border)] hover:shadow-md hover:border-[var(--border)]"}`}>
                      <div className="flex items-center">
                        <button
                          onClick={() => setExpandedCollectionId(isExpanded ? null : col.id)}
                          className="flex-1 flex items-center gap-3 px-5 py-4 text-left min-w-0"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0">
                            <svg className="w-[18px] h-[18px] text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{col.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                              {colMats.length} file{colMats.length !== 1 ? "s" : ""} · {new Date(col.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <svg className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-2 pr-4 pl-2 flex-shrink-0">
                          {confirmDelete ? (
                            <>
                              <span className="text-xs text-[var(--text-secondary)]">Delete?</span>
                              <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCollectionId(null); }} className="px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)]">Cancel</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id, col.name); }} className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteCollectionId(col.id); }}
                              disabled={isDeleting}
                              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? <Spinner size="xs" className="border-red-200 border-t-red-500" /> : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-[var(--border)] px-5 py-4">
                          {colMats.length === 0 ? (
                            <p className="text-sm text-[var(--text-tertiary)] text-center py-4">No files in this collection yet. Add files from the All Files tab.</p>
                          ) : (
                            <div className="space-y-2">
                              {colMats.map((mat) => {
                                const icon = fileIcon(mat.file_name);
                                return (
                                  <div key={mat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--background)] hover:bg-[var(--surface-2)] transition-colors">
                                    <div className={`w-8 h-8 rounded-lg ${icon.color} flex items-center justify-center flex-shrink-0`}>{icon.icon}</div>
                                    <p className="flex-1 min-w-0 text-sm font-medium text-[var(--text-primary)] truncate">{mat.file_name}</p>
                                    <button
                                      onClick={() => handleRemoveFromCollection(col.id, mat.id)}
                                      className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                      aria-label="Remove from collection"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Modal
            open={createModalOpen}
            onClose={() => { setCreateModalOpen(false); setNewCollectionName(""); }}
            title="Create Collection"
            description="Group related files for focused AI generation."
            size="sm"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Collection name</label>
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value.slice(0, 50))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateCollection(); }}
                  placeholder="e.g. Chapter 5, Week 3 Readings"
                  className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)]"
                  maxLength={50}
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{newCollectionName.length}/50 characters</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setCreateModalOpen(false); setNewCollectionName(""); }}>Cancel</Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || creating}
                  className="flex-1"
                  leftIcon={creating ? <Spinner size="sm" className="border-white/30 border-t-white" /> : undefined}
                >
                  {creating ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}

      <CanvasImportModal
        isOpen={canvasImportOpen}
        onClose={() => setCanvasImportOpen(false)}
        courseId={courseId}
        onImportComplete={() => { setCanvasImportOpen(false); onImportComplete(); }}
        existingMaterials={materials}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

function CollectionSelector({
  collections,
  selectedCollectionId,
  onChange,
}: {
  collections: Collection[];
  selectedCollectionId: string | null;
  onChange: (id: string | null) => void;
}) {
  if (collections.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Generate from:</span>
      <select
        value={selectedCollectionId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer max-w-[160px] truncate outline-none"
        style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)" }}
      >
        <option value="">All materials</option>
        {collections.map((col) => (
          <option key={col.id} value={col.id}>{col.name}</option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY GUIDE TAB
// ─────────────────────────────────────────────────────────────────────────────

type GuideStreamState = {
  title: string;
  content: string;
  done: boolean;
  saving: boolean;
} | null;

function StudyGuideTab({
  courseId,
  canGenerate,
  collections,
  selectedCollectionId,
  onCollectionChange,
}: {
  courseId: string;
  canGenerate: boolean;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
}) {
  const { addToast } = useToast();
  const [guides, setGuides] = useState<StudyGuideSaved[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [guideError, setGuideError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<GuideStreamState>(null);

  const isGenerating = streamState !== null && !streamState.done;
  const showStreamPreview = streamState !== null;

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

  function openTitleModal() {
    setTitleInput("");
    setTitleModalOpen(true);
  }

  async function handleGenerate() {
    const title = titleInput.trim();
    if (!title) return;
    setTitleModalOpen(false);
    setGuideError("");
    setStreamState({ title, content: "", done: false, saving: false });

    try {
      for await (const chunk of streamStudyGuide(courseId, title, selectedCollectionId ?? undefined)) {
        setStreamState((prev) => prev ? { ...prev, content: prev.content + chunk } : prev);
      }
      setStreamState((prev) => prev ? { ...prev, done: true } : prev);
    } catch (err: unknown) {
      setStreamState(null);
      setGuideError(err instanceof Error ? err.message : "Failed to generate study guide.");
    }
  }

  async function handleSave() {
    if (!streamState || !streamState.done) return;
    setStreamState((prev) => prev ? { ...prev, saving: true } : prev);
    try {
      const saved = await saveStudyGuide(courseId, streamState.title, streamState.content);
      setGuides((prev) => [saved, ...prev]);
      setExpandedId(saved.id);
      setStreamState(null);
      addToast("Study guide saved!", "success");
    } catch (err: unknown) {
      setStreamState((prev) => prev ? { ...prev, saving: false } : prev);
      addToast(err instanceof Error ? err.message : "Failed to save study guide.", "error");
    }
  }

  function handleDiscard() {
    setStreamState(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteStudyGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
      if (expandedId === id) setExpandedId(null);
      addToast("Study guide deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const atLimit = guides.length >= 5;

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
          <CollectionSelector
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onChange={onCollectionChange}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={openTitleModal}
            disabled={isGenerating || !canGenerate || atLimit || showStreamPreview}
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

      {/* Error */}
      {guideError && (
        <div className="mb-5">
          <AiErrorBlock error={guideError} onRetry={() => setGuideError("")} />
        </div>
      )}

      {/* Streaming preview */}
      {showStreamPreview && streamState && (
        <div className="mb-5 bg-[var(--surface)] rounded-2xl border border-[var(--accent-dim)] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)]">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{streamState.title}</p>
              <p className="text-xs text-[var(--accent)] font-medium">
                {isGenerating ? "Generating…" : "Ready to save"}
              </p>
            </div>
            {streamState.done && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscard}
                  disabled={streamState.saving}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={streamState.saving}
                  leftIcon={streamState.saving ? <Spinner size="sm" className="border-white/30 border-t-white" /> : undefined}
                >
                  {streamState.saving ? "Saving…" : "Save Guide"}
                </Button>
              </div>
            )}
          </div>
          <div className="px-5 py-4 max-h-96 overflow-y-auto">
            {streamState.content ? (
              <div className="prose prose-sm prose-slate max-w-none">
                <MarkdownWithMath content={streamState.content} className="text-sm leading-relaxed" />
                {isGenerating && <span className="streaming-cursor" />}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm py-2">
                <div className="flex gap-1">
                  <div className="typing-dot" style={{ animationDelay: "0ms" }} />
                  <div className="typing-dot" style={{ animationDelay: "160ms" }} />
                  <div className="typing-dot" style={{ animationDelay: "320ms" }} />
                </div>
                <span>Generating your study guide…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skeleton loader */}
      {!showStreamPreview && loadingGuides && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Guide list */}
      {!showStreamPreview && !loadingGuides && (
        guides.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            title="No study guides yet"
            description="Generate your first one to create a comprehensive study guide from your course materials."
            action={
              canGenerate ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={openTitleModal}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  }
                >
                  Generate Study Guide
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideAccordionItem
                key={guide.id}
                guide={guide}
                isExpanded={expandedId === guide.id}
                onToggle={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
                isDeleting={deletingId === guide.id}
                confirmDelete={confirmDeleteId === guide.id}
                onConfirmDelete={() => setConfirmDeleteId(guide.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onDelete={() => handleDelete(guide.id)}
              />
            ))}
          </div>
        )
      )}

      {/* Title input modal */}
      <Modal
        open={titleModalOpen}
        onClose={() => setTitleModalOpen(false)}
        title="Name Your Study Guide"
        description="Give this guide a title so you can find it later."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Title</label>
            <input
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value.slice(0, 60))}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              placeholder="e.g. Chapter 5 — Organic Chemistry"
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)]"
              maxLength={60}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{titleInput.length}/60 characters</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTitleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={!titleInput.trim()}
              className="flex-1"
            >
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GuideAccordionItem({
  guide,
  isExpanded,
  onToggle,
  isDeleting,
  confirmDelete,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: {
  guide: StudyGuideSaved;
  isExpanded: boolean;
  onToggle: () => void;
  isDeleting: boolean;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-[var(--surface)] rounded-2xl border shadow-sm transition-all ${isExpanded ? "border-[var(--accent-dim)]" : "border-[var(--border)] hover:border-[var(--border)] hover:shadow-md"}`}>
      <div className="flex items-center">
        <button
          onClick={onToggle}
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
            className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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

      {isExpanded && (
        <div className="border-t border-[var(--border)] px-5 py-5">
          <MarkdownWithMath
            content={guide.content}
            className="study-guide-content text-sm text-[var(--text-primary)] leading-relaxed"
          />
        </div>
      )}
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

const EXPECTED_QUIZ_QUESTIONS = 10;

function QuizTab({
  courseId, rawQuizContent,
  quiz, loading, error, generatedAt, onGenerate, onRegenerate, canGenerate,
  streamingQuiz, streamedQuestions, quizGenerationId, collections, selectedCollectionId, onCollectionChange,
}: {
  courseId: string;
  rawQuizContent: string;
  quiz: Quiz | null;
  loading: boolean;
  error: string;
  generatedAt: Date | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  canGenerate: boolean;
  streamingQuiz: boolean;
  streamedQuestions: QuizQuestion[];
  quizGenerationId: number;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
}) {
  const { addToast } = useToast();
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  // Saved quizzes state
  const [savedQuizzes, setSavedQuizzes] = useState<QuizSaved[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitleInput, setSaveTitleInput] = useState("");
  const [savingQuiz, setSavingQuiz] = useState(false);

  function resetQuiz() {
    setCurrentQ(0);
    setSelected({});
    setRevealed({});
    setShowResults(false);
  }

  useEffect(() => {
    resetQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizGenerationId]);

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
      // Non-fatal
    } finally {
      setLoadingSaved(false);
    }
  }

  async function handleSaveQuiz() {
    const title = saveTitleInput.trim();
    if (!title || !rawQuizContent) return;
    setSavingQuiz(true);
    try {
      const saved = await saveQuiz(courseId, title, rawQuizContent);
      setSavedQuizzes((prev) => [saved, ...prev]);
      setExpandedQuizId(saved.id);
      setSaveModalOpen(false);
      setSaveTitleInput("");
      addToast("Quiz saved!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save quiz.";
      if (/limit/i.test(msg)) {
        addToast("Delete a saved quiz to save a new one.", "error");
      } else {
        addToast(msg, "error");
      }
    } finally {
      setSavingQuiz(false);
    }
  }

  async function handleDeleteSavedQuiz(id: string) {
    setDeletingQuizId(id);
    setQuizToDeleteId(null);
    try {
      await deleteSavedQuiz(id);
      setSavedQuizzes((prev) => prev.filter((q) => q.id !== id));
      if (expandedQuizId === id) setExpandedQuizId(null);
      addToast("Quiz deleted.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingQuizId(null);
    }
  }

  // During streaming use streamedQuestions; once done use quiz.questions
  const effectiveQuestions = streamingQuiz ? streamedQuestions : (quiz?.questions ?? []);
  const hasQuestions = effectiveQuestions.length > 0;

  const totalQ = streamingQuiz ? EXPECTED_QUIZ_QUESTIONS : (quiz?.questions.length ?? 0);
  const answeredCount = Object.keys(revealed).length;
  const correctCount = (quiz?.questions ?? []).filter((q, i) => revealed[i] && selected[i] === q.correctAnswer).length;

  const isLoadingFirstQuestion = streamingQuiz && !hasQuestions;
  const nextQuestionLoading = streamingQuiz && currentQ >= effectiveQuestions.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Practice Quiz</h2>
          {generatedAt && !loading && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Generated {generatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CollectionSelector
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onChange={onCollectionChange}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={(quiz || hasQuestions) ? onRegenerate : onGenerate}
            loading={loading}
            disabled={loading || !canGenerate}
            leftIcon={!loading ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            ) : undefined}
          >
            {(quiz || hasQuestions)
              ? (selectedCollectionId ? `Regenerate from: ${collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection"}` : "Regenerate")
              : (selectedCollectionId ? `Generate from: ${collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection"}` : "Generate")}
          </Button>
          {quiz && !streamingQuiz && rawQuizContent && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setSaveTitleInput(""); setSaveModalOpen(true); }}
              disabled={savedQuizzes.length >= 5}
              title={savedQuizzes.length >= 5 ? "Delete a saved quiz to save a new one" : undefined}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              }
            >
              Save Quiz
            </Button>
          )}
        </div>
      </div>

      {isLoadingFirstQuestion && <AiLoadingProgress type="quiz" />}

      {!loading && !streamingQuiz && error && <AiErrorBlock error={error} onRetry={onGenerate} />}

      {!loading && !streamingQuiz && !error && !quiz && (
        <EmptyState
          icon={<svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
          title="No quiz yet"
          description="Click Generate to create practice questions from your course materials."
          action={
            <Button variant="primary" size="md" onClick={onGenerate} disabled={!canGenerate}
              leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
            >
              Generate Quiz
            </Button>
          }
        />
      )}

      {hasQuestions && !showResults && (
        <div>
          {nextQuestionLoading ? (
            <div className="rounded-xl border p-8 text-center text-sm animate-pulse" style={{ background: "var(--accent-dim)", borderColor: "var(--accent-dim)", color: "var(--accent)" }}>
              Loading next question...
            </div>
          ) : (<>
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Question {currentQ + 1} of {totalQ}</span>
              <span>{answeredCount} answered</span>
            </div>
            <ProgressBar value={((currentQ) / totalQ) * 100} size="sm" />
          </div>

          <QuizQuestion
            question={effectiveQuestions[currentQ]}
            index={currentQ}
            selected={selected[currentQ]}
            revealed={!!revealed[currentQ]}
            onSelect={(letter) => {
              if (!revealed[currentQ]) {
                setSelected((s) => ({ ...s, [currentQ]: letter }));
                setRevealed((r) => ({ ...r, [currentQ]: true }));
              }
            }}
          />

          {streamingQuiz && (
            <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center">
              Loading questions... ({effectiveQuestions.length} of {EXPECTED_QUIZ_QUESTIONS} ready)
            </p>
          )}

          <div className="flex items-center justify-between mt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              }
            >
              Previous
            </Button>

            <span className="text-sm text-[var(--text-tertiary)] font-medium">
              {Object.keys(revealed).length}/{totalQ} answered
            </span>

            {revealed[currentQ] && (currentQ < totalQ - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentQ((q) => q + 1)}
                rightIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                }
              >
                Next
              </Button>
            ) : !streamingQuiz ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowResults(true)}
              >
                See results
              </Button>
            ) : null)}
          </div>
          </>)}
        </div>
      )}

      {!streamingQuiz && quiz && showResults && (
        <QuizResults
          quiz={quiz}
          selected={selected}
          revealed={revealed}
          correctCount={correctCount}
          totalQ={totalQ}
          onRetry={resetQuiz}
          onRegenerate={onRegenerate}
        />
      )}

      {/* ── Saved Quizzes ─────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Saved Quizzes</h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            {savedQuizzes.length}/5
          </span>
        </div>

        {loadingSaved ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        ) : savedQuizzes.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No saved quizzes yet
          </div>
        ) : (
          <div className="space-y-3">
            {savedQuizzes.map((sq) => (
              <SavedQuizAccordionItem
                key={sq.id}
                quiz={sq}
                isExpanded={expandedQuizId === sq.id}
                onToggle={() => setExpandedQuizId(expandedQuizId === sq.id ? null : sq.id)}
                isDeleting={deletingQuizId === sq.id}
                confirmDelete={quizToDeleteId === sq.id}
                onConfirmDelete={() => setQuizToDeleteId(sq.id)}
                onCancelDelete={() => setQuizToDeleteId(null)}
                onDelete={() => handleDeleteSavedQuiz(sq.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Quiz modal */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Quiz"
        description="Give this quiz a title so you can find it later."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Title</label>
            <input
              autoFocus
              value={saveTitleInput}
              onChange={(e) => setSaveTitleInput(e.target.value.slice(0, 60))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveQuiz(); }}
              placeholder="e.g. Chapter 5 Practice Quiz"
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)]"
              maxLength={60}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{saveTitleInput.length}/60 characters</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveQuiz}
              disabled={!saveTitleInput.trim() || savingQuiz}
              className="flex-1"
              leftIcon={savingQuiz ? <Spinner size="sm" className="border-white/30 border-t-white" /> : undefined}
            >
              {savingQuiz ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function QuizQuestion({
  question, index, selected, revealed, onSelect,
}: {
  question: Quiz["questions"][0];
  index: number;
  selected: string | undefined;
  revealed: boolean;
  onSelect: (letter: string) => void;
}) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-5 sm:p-6 animate-fade-in-up">
      <div className="font-semibold text-[var(--text-primary)] mb-5 leading-snug flex items-start gap-1.5">
        <span className="text-[var(--accent)] font-bold flex-shrink-0">{index + 1}.</span>
        <MarkdownWithMath content={question.question} className="flex-1 min-w-0" />
      </div>

      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selected === opt.letter;
          const isCorrect = question.correctAnswer === opt.letter;
          return (
            <button
              key={opt.letter}
              onClick={() => onSelect(opt.letter)}
              disabled={revealed}
              className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 btn-press
                ${revealed
                  ? isSelected && isCorrect
                    ? "answer-correct-pulse"
                    : isSelected && !isCorrect
                    ? "answer-shake"
                    : ""
                  : isSelected
                  ? "bg-[var(--accent-dim)] border-[var(--accent)] text-violet-900 shadow-sm"
                  : "border-[var(--border)] hover:border-[var(--accent-dim)] hover:bg-[var(--accent-dim)]/50 text-[var(--text-primary)]"
                }
              `}
              style={revealed ? {
                background: isCorrect
                  ? "rgba(107, 255, 184, 0.08)"
                  : isSelected
                  ? "rgba(255, 107, 107, 0.08)"
                  : "var(--surface)",
                borderColor: isCorrect
                  ? "rgba(107, 255, 184, 0.3)"
                  : isSelected
                  ? "rgba(255, 107, 107, 0.3)"
                  : "var(--border)",
                color: isCorrect
                  ? "#6bffb8"
                  : isSelected
                  ? "#ff6b6b"
                  : "var(--text-secondary)",
              } : undefined}
            >
              <div className="flex items-start gap-3">
                {revealed && isCorrect && (
                  <svg className="answer-icon-pop w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#6bffb8" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {revealed && isSelected && !isCorrect && (
                  <svg className="answer-icon-pop w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#ff6b6b" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-bold flex-shrink-0">{opt.letter}.</span>
                <MarkdownWithMath content={opt.text} className="flex-1 min-w-0" />
              </div>
            </button>
          );
        })}
        {revealed && question.explanation && (
          <div className="mt-3 px-4 py-3 rounded-xl text-sm border" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <p className="font-semibold mb-0.5 flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Explanation
            </p>
            <MarkdownWithMath content={question.explanation} className="leading-relaxed" />
          </div>
        )}
      </div>
    </div>
  );
}

function QuizResults({
  quiz, selected, revealed, correctCount, totalQ, onRetry, onRegenerate,
}: {
  quiz: Quiz;
  selected: Record<number, string>;
  revealed: Record<number, boolean>;
  correctCount: number;
  totalQ: number;
  onRetry: () => void;
  onRegenerate: () => void;
}) {
  const pct = Math.round((correctCount / totalQ) * 100);
  const grade = pct >= 80 ? { label: "Excellent!", color: "text-emerald-600", bg: "from-emerald-500 to-teal-600" }
    : pct >= 60 ? { label: "Good job!", color: "text-blue-600", bg: "from-blue-500 to-indigo-600" }
    : { label: "Keep studying!", color: "text-amber-600", bg: "from-amber-500 to-orange-600" };

  return (
    <div className="animate-scale-in">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8 text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${grade.bg} text-white text-3xl font-extrabold mb-4 shadow-lg`}>
          {pct}%
        </div>
        <h3 className={`text-xl font-extrabold mb-1 ${grade.color}`}>{grade.label}</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          You got <strong className="text-[var(--text-primary)]">{correctCount} out of {totalQ}</strong> questions correct
        </p>
        <ProgressBar value={pct} size="lg" />

        <div className="flex gap-3 mt-6 justify-center">
          <Button variant="secondary" size="md" onClick={onRetry}>
            Try again
          </Button>
          <Button variant="primary" size="md" onClick={onRegenerate}>
            New questions
          </Button>
        </div>
      </div>

      {/* Question breakdown */}
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Question breakdown</h3>
      <div className="space-y-2">
        {quiz.questions.map((q, i) => {
          const userLetter = selected[i];
          const isCorrect = userLetter === q.correctAnswer;
          const wasAnswered = revealed[i];
          const userOption = userLetter ? q.options.find((o) => o.letter === userLetter) : undefined;
          const correctOption = q.options.find((o) => o.letter === q.correctAnswer);
          return (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl text-sm ${isCorrect && wasAnswered ? "bg-emerald-50 border border-emerald-100" : wasAnswered ? "bg-red-50 border border-red-100" : "bg-[var(--background)] border border-[var(--border)]"}`}>
              <span className={`flex-shrink-0 mt-0.5 ${isCorrect && wasAnswered ? "text-emerald-500" : wasAnswered ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
                {wasAnswered ? (
                  isCorrect ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                )}
              </span>
              <div>
                <MarkdownWithMath content={q.question} className="font-medium text-[var(--text-primary)]" />
                {wasAnswered && (
                  <div className="text-xs text-[var(--text-secondary)] mt-1.5 space-y-0.5">
                    <p>
                      Your answer:{" "}
                      <span className={isCorrect ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                        {userOption ? `${userOption.letter}. ${userOption.text}` : (userLetter ?? "—")}
                      </span>
                    </p>
                    {!isCorrect && correctOption && (
                      <p>Correct: <span className="text-emerald-700 font-medium">{correctOption.letter}. {correctOption.text}</span></p>
                    )}
                    {q.explanation && (
                      <MarkdownWithMath content={q.explanation} className="text-[var(--text-tertiary)] mt-1 leading-relaxed" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavedQuizAccordionItem({
  quiz: savedQuiz,
  isExpanded,
  onToggle,
  isDeleting,
  confirmDelete,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: {
  quiz: QuizSaved;
  isExpanded: boolean;
  onToggle: () => void;
  isDeleting: boolean;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const questions = useMemo(() => parseQuizMarkdown(savedQuiz.content), [savedQuiz.content]);

  useEffect(() => {
    if (!isExpanded) {
      setCurrentQ(0);
      setSelected({});
      setRevealed({});
    }
  }, [isExpanded]);

  return (
    <div className={`bg-[var(--surface)] rounded-2xl border shadow-sm transition-all ${isExpanded ? "border-[var(--accent-dim)]" : "border-[var(--border)] hover:shadow-md"}`}>
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 px-5 py-4 text-left min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0">
            <svg className="w-[18px] h-[18px] text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{savedQuiz.title || "Untitled Quiz"}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {new Date(savedQuiz.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {questions.length > 0 && ` · ${questions.length} questions`}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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

      {isExpanded && questions.length > 0 && (
        <div className="border-t border-[var(--border)] px-5 py-5">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>{Object.keys(revealed).length} answered</span>
            </div>
            <ProgressBar value={(currentQ / questions.length) * 100} size="sm" />
          </div>
          <QuizQuestion
            question={questions[currentQ]}
            index={currentQ}
            selected={selected[currentQ]}
            revealed={!!revealed[currentQ]}
            onSelect={(letter) => {
              if (!revealed[currentQ]) {
                setSelected((s) => ({ ...s, [currentQ]: letter }));
                setRevealed((r) => ({ ...r, [currentQ]: true }));
              }
            }}
          />
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              }
            >
              Previous
            </Button>
            <span className="text-sm text-[var(--text-tertiary)] font-medium">
              {Object.keys(revealed).length}/{questions.length} answered
            </span>
            {currentQ < questions.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentQ((q) => q + 1)}
                disabled={!revealed[currentQ]}
                rightIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                }
              >
                Next
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setCurrentQ(0); setSelected({}); setRevealed({}); }}
              >
                Restart
              </Button>
            )}
          </div>
        </div>
      )}

      {isExpanded && questions.length === 0 && (
        <div className="border-t border-[var(--border)] px-5 py-5 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
          Could not parse quiz questions.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY PLAN TAB
// ─────────────────────────────────────────────────────────────────────────────

function StudyPlanTab({
  studyPlan, loading, error, examDate, setExamDate, onGenerate, onRegenerate, canGenerate,
  collections, selectedCollectionId, onCollectionChange,
}: {
  studyPlan: AiResponse | null;
  loading: boolean;
  error: string;
  examDate: string;
  setExamDate: (v: string) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  canGenerate: boolean;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
}) {
  const daysUntilExam = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Study Plan</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Set your exam date for a personalized schedule</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CollectionSelector
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onChange={onCollectionChange}
          />
          <div className="relative">
            <input
              type="date"
              value={examDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setExamDate(e.target.value)}
              className="px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)] transition-all text-[var(--text-primary)]"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={studyPlan ? onRegenerate : onGenerate}
            loading={loading}
            disabled={loading || !canGenerate}
            leftIcon={!loading ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            ) : undefined}
          >
            {studyPlan
              ? (selectedCollectionId ? `Regenerate from: ${collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection"}` : "Regenerate")
              : (selectedCollectionId ? `Generate from: ${collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection"}` : "Generate")}
          </Button>
        </div>
      </div>

      {/* Days until exam badge */}
      {daysUntilExam !== null && daysUntilExam > 0 && (
        <div className="mb-5 inline-flex items-center gap-2 bg-[var(--accent-dim)] border border-[var(--accent-dim)] text-[var(--accent)] text-sm font-semibold px-4 py-2 rounded-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {daysUntilExam} day{daysUntilExam !== 1 ? "s" : ""} until exam
        </div>
      )}

      {loading && <AiLoadingProgress type="study-plan" />}

      {!loading && error && <AiErrorBlock error={error} onRetry={onGenerate} />}

      {!loading && !error && !studyPlan && (
        <EmptyState
          icon={<svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
          title="No study plan yet"
          description="Set your exam date and click Generate for a personalized day-by-day study schedule."
          action={
            <Button variant="primary" size="md" onClick={onGenerate} disabled={!canGenerate}
              leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
            >
              Generate Study Plan
            </Button>
          }
        />
      )}

      {!loading && studyPlan && (
        <StudyPlanTimeline content={studyPlan.content || ""} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY PLAN TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

interface StudyPlanDay {
  day: string;
  title: string;
  tasks: string[];
}

function parseStudyPlanDays(content: string): StudyPlanDay[] {
  const days: StudyPlanDay[] = [];
  const lines = content.split("\n");

  let currentDay: StudyPlanDay | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match "Day 1:", "## Day 1", "**Day 1**", "Day 1 -", etc.
    const dayMatch = trimmed.match(/^(?:#+\s*|[\*_]{0,2})(day\s+\d+(?:\s*[-–:]\s*.+)?)/i);
    if (dayMatch) {
      if (currentDay) days.push(currentDay);
      const full = dayMatch[1];
      const numMatch = full.match(/day\s+(\d+)/i);
      const titleRest = full.replace(/day\s+\d+\s*[-–:]?\s*/i, "").trim();
      currentDay = {
        day: numMatch ? `Day ${numMatch[1]}` : "Day",
        title: titleRest || "",
        tasks: [],
      };
      continue;
    }

    // If we have a current day, collect bullet points / tasks
    if (currentDay) {
      const taskMatch = trimmed.match(/^[-•*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/);
      if (taskMatch) {
        currentDay.tasks.push(taskMatch[1].replace(/\*+/g, "").trim());
      } else if (trimmed && !trimmed.startsWith("#") && currentDay.tasks.length === 0) {
        // Plain text as the task
        currentDay.tasks.push(trimmed.replace(/\*+/g, "").replace(/^[-–:]\s*/, "").trim());
      }
    }
  }
  if (currentDay) days.push(currentDay);
  return days;
}

function StudyPlanTimeline({ content }: { content: string }) {
  const days = parseStudyPlanDays(content);

  // If parsing yields no structured days, fall back to prose rendering
  if (days.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8">
        <MarkdownWithMath
          content={content}
          className="study-guide-content text-sm text-[var(--text-primary)] leading-relaxed"
        />
      </div>
    );
  }

  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--accent-dim)] via-[var(--border)] to-[var(--success)] rounded-full" style={{ left: "1.25rem" }} />

      <div className="space-y-4">
        {days.map((day, i) => (
          <div key={i} className="relative flex gap-5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            {/* Day bubble */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shadow-sm z-10`}>
              <span className="text-white font-bold text-xs leading-none text-center">
                {day.day.replace("Day ", "D")}
              </span>
            </div>

            {/* Content card */}
            <div className="flex-1 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-4 hover:shadow-md hover:border-[var(--accent-dim)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {day.day}{day.title ? ` — ${day.title}` : ""}
                </h3>
                <span className="text-xs text-[var(--text-tertiary)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                  {day.tasks.length} task{day.tasks.length !== 1 ? "s" : ""}
                </span>
              </div>
              {day.tasks.length > 0 && (
                <ul className="space-y-1.5">
                  {day.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5" />
                      {task}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
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
  collections, selectedCollectionId, onCollectionChange,
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
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(chatInput);
    }
  }

  return (
    <div className="flex flex-col bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">AI Tutor</p>
          <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Online
          </p>
        </div>
        <CollectionSelector
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onChange={onCollectionChange}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-4 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Ask your AI tutor anything</h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-6 max-w-xs">
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
                    className="px-3.5 py-2 text-xs font-medium text-[var(--accent)] bg-[var(--accent-dim)] border border-[var(--accent-dim)] rounded-full hover:bg-[var(--accent-dim)] transition-colors"
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
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-br-sm"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm chat-markdown"
                }`}
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
                <div className="w-8 h-8 rounded-full bg-[var(--accent-dim)] flex items-center justify-center flex-shrink-0 mt-0.5 text-[var(--accent)] font-semibold text-xs">
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
            <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm">
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

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canChat ? "Ask a question… (Enter to send, Shift+Enter for newline)" : "Upload materials to start chatting"}
              disabled={chatLoading || chatStreaming || !canChat}
              rows={1}
              className={`w-full px-4 py-3 border rounded-xl text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)] transition-all resize-none max-h-32 disabled:bg-[var(--background)] disabled:text-[var(--text-tertiary)] ${chatLoading ? "border-[var(--border)]" : "border-[var(--border)]"}`}
              style={{ lineHeight: 1.5 }}
            />
          </div>
          <button
            onClick={() => onSend(chatInput)}
            disabled={chatLoading || chatStreaming || !chatInput.trim() || !canChat}
            className="btn-gradient btn-press flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
        <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
