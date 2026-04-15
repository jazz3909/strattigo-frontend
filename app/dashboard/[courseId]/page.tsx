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
  Quiz,
  StudyEvent,
  FlashcardSet,
  Flashcard,
  type QuizQuestion,
  getToken,
} from "../../lib/api";
import { CanvasImportModal } from "../../components/CanvasImportModal";
import { Button } from "../../components/ui/Button";
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

type ActiveTab = "study-guide" | "quiz" | "flashcards" | "study-plan" | "chat";


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
  const [activeTab, setActiveTab] = useState<ActiveTab>("study-guide");

  // Materials
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas import (lifted from MaterialsTab for left panel)
  const [canvasImportOpen, setCanvasImportOpen] = useState(false);
  const [canvasConnected, setCanvasConnected] = useState(false);

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

  useEffect(() => {
    getCanvasCourses().then(() => setCanvasConnected(true)).catch(() => setCanvasConnected(false));
  }, []);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── ZONE 1: COURSE HEADER ─────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,14,24,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        flexShrink: 0,
      }}>
        {/* Breadcrumb / back link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          <Link
            href="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', textDecoration: 'none', transition: 'color 150ms ease' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)')}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Courses
          </Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {course?.name}
          </span>
        </div>

        {/* Course identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${courseGradient(course?.name ?? "")} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
            {course?.name?.[0]?.toUpperCase() ?? "C"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)', lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {course?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <Badge variant="purple" size="sm" dot>
                {materials.length} material{materials.length !== 1 ? "s" : ""}
              </Badge>
              {hasNoMaterials && (
                <Badge variant="amber" size="sm">Upload materials to unlock AI</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ZONE 2+3: BODY (left panel + right panel) ──── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── LEFT PANEL: MATERIALS ───────────────────── */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          position: 'relative',
        }}>
          {/* Left panel header */}
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px', margin: '0 0 4px 0' }}>
              Materials
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {materials.length} files
            </span>
          </div>

          {/* Left panel file list (scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {materials.map((m) => (
              <div
                key={m.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'default', transition: 'background 200ms ease', marginBottom: '2px' }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
              >
                {/* File type icon */}
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(225,148,133,0.12)', border: '1px solid rgba(225,148,133,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 500, textTransform: 'uppercase' }}>
                    {m.file_name?.split('.').pop()?.slice(0, 3) ?? 'TXT'}
                  </span>
                </div>
                {/* File info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px 0' }}>
                    {m.file_name}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                    {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
                {/* Delete button */}
                <div style={{ flexShrink: 0 }}>
                  {confirmDeleteId === m.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(m.id, m.file_name)}
                        style={{ padding: '3px 8px', fontSize: '11px', color: 'white', background: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(m.id)}
                      disabled={deletingId === m.id}
                      style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', opacity: deletingId === m.id ? 0.5 : 1, transition: 'color 150ms ease', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)')}
                      aria-label="Delete file"
                    >
                      {deletingId === m.id ? (
                        <Spinner size="xs" className="border-red-200 border-t-red-500" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No materials yet
              </div>
            )}
          </div>

          {/* Left panel footer: upload + canvas import */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '10px',
                background: uploading ? 'var(--surface-2)' : 'var(--accent)',
                color: uploading ? 'var(--text-tertiary)' : 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontFamily: 'var(--font-outfit)',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'opacity 200ms ease',
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? (
                <><Spinner size="sm" className="border-white/30 border-t-white" /> Uploading…</>
              ) : (
                <>↑ Upload file</>
              )}
            </button>
            {/* Upload progress */}
            {uploading && uploadProgress > 0 && (
              <ProgressBar value={uploadProgress} size="sm" />
            )}
            {/* Import from Canvas */}
            {canvasConnected && (
              <button
                onClick={() => setCanvasImportOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-outfit)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }}
              >
                Import from Canvas
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: AI TOOLS ───────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            overflowX: 'auto',
          }}>
            {(['Study Guide', 'Quiz', 'Flashcards', 'Study Plan', 'Chat'] as const).map((tab) => {
              const tabId = tab.toLowerCase().replace(/ /g, '-') as ActiveTab;
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'Quiz') handleQuizTab();
                    else if (tab === 'Study Guide') handleStudyGuideTab();
                    else if (tab === 'Study Plan') handleStudyPlanTab();
                    else setActiveTab(tabId);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-outfit)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* No materials warning */}
          {hasNoMaterials && (
            <div style={{ padding: '10px 20px', background: 'rgba(251,191,36,0.06)', borderBottom: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <svg style={{ width: '16px', height: '16px', color: '#fbbf24', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p style={{ fontSize: '13px', color: '#fbbf24', margin: 0 }}>
                Upload course materials in the left panel to unlock AI features.
              </p>
            </div>
          )}

          {/* Collections selector — between tab bar and content */}
          {collections.length > 0 && (
            <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <CollectionSelector
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onChange={setSelectedCollectionId}
              />
            </div>
          )}

          {/* Scrollable content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {/* ── STUDY GUIDE ──────────────────────────── */}
            {activeTab === "study-guide" && (
              <StudyGuideTab
                courseId={courseId}
                canGenerate={!hasNoMaterials}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onCollectionChange={setSelectedCollectionId}
              />
            )}

            {/* ── QUIZ ─────────────────────────────────── */}
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

            {/* ── FLASHCARDS ───────────────────────────── */}
            {activeTab === "flashcards" && (
              <FlashcardsTab
                courseId={courseId}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onCollectionChange={setSelectedCollectionId}
                canGenerate={!hasNoMaterials}
              />
            )}

            {/* ── STUDY PLAN ───────────────────────────── */}
            {activeTab === "study-plan" && (
              <StudyPlanTab
                courseId={courseId}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onCollectionChange={setSelectedCollectionId}
              />
            )}

            {/* ── CHAT ─────────────────────────────────── */}
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
        </div>
      </div>

      {/* Canvas import modal (wired to left panel button) */}
      <CanvasImportModal
        isOpen={canvasImportOpen}
        onClose={() => setCanvasImportOpen(false)}
        courseId={courseId}
        onImportComplete={() => { setCanvasImportOpen(false); loadPage(); }}
        existingMaterials={materials}
      />
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
            <div className="space-y-2 overflow-visible">
              {materials.map((m, i) => {
                const icon = fileIcon(m.file_name);
                const isRenaming = renamingId === m.id;
                const matCols = (materialCollectionMap[m.id] ?? []).map((cid) => collections.find((c) => c.id === cid)).filter(Boolean) as Collection[];
                const isPopoverOpen = addToCollectionPopoverId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`relative z-[1] hover:z-10 flex items-center gap-4 bg-[var(--surface)] px-5 py-4 rounded-2xl border shadow-sm transition-all group animate-fade-in-up ${isRenaming ? "border-[var(--accent-dim)]" : "border-[var(--border)] hover:shadow-md hover:border-[var(--border)]"}`}
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
                        <div className="relative z-[2]">
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
  const [studyGuideStyle, setStudyGuideStyle] = useState<"detailed" | "bullet">("detailed");
  const [focusTopics, setFocusTopics] = useState("");
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
    setStudyGuideStyle("detailed");
    setFocusTopics("");
    setTitleModalOpen(true);
  }

  async function handleGenerate() {
    const title = titleInput.trim();
    if (!title) return;
    setTitleModalOpen(false);
    setGuideError("");
    setStreamState({ title, content: "", done: false, saving: false });

    try {
      for await (const chunk of streamStudyGuide(courseId, title, selectedCollectionId ?? undefined, focusTopics, studyGuideStyle)) {
        setStreamState((prev) => prev ? { ...prev, content: prev.content + chunk } : prev);
      }
      setStreamState((prev) => prev ? { ...prev, done: true } : prev);
      setStudyGuideStyle("detailed");
      setFocusTopics("");
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
        title="Generate Study Guide"
        description="Customize your study guide before generating."
        size="sm"
      >
        <div className="space-y-5">
          {/* Style selector */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Study Guide Style</p>
            <div className="flex gap-3">
              {([
                {
                  id: "detailed" as const,
                  title: "In-Depth",
                  subtitle: "Detailed explanations with examples",
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  ),
                },
                {
                  id: "bullet" as const,
                  title: "Quick Reference",
                  subtitle: "Scannable bullet points & key facts",
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  ),
                },
              ] as { id: "detailed" | "bullet"; title: string; subtitle: string; icon: React.ReactNode }[]).map((opt) => {
                const selected = studyGuideStyle === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setStudyGuideStyle(opt.id)}
                    className="flex-1 flex items-center gap-3 cursor-pointer transition-all duration-150"
                    style={{
                      padding: "14px 16px",
                      borderRadius: "var(--radius-md, 12px)",
                      border: selected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: selected ? "var(--accent-dim)" : "var(--surface-2)",
                      color: selected ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: selected ? "var(--accent-dim)" : "var(--surface-3)", color: selected ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      {opt.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{opt.title}</p>
                      <p className="text-xs mt-0.5 leading-tight" style={{ color: "var(--text-secondary)" }}>{opt.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Study guide name</label>
            <input
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value.slice(0, 60))}
              onKeyDown={(e) => { if (e.key === "Enter" && titleInput.trim()) handleGenerate(); }}
              placeholder="e.g. Chapter 5 — Organic Chemistry"
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)]"
              maxLength={60}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{titleInput.length}/60 characters</p>
          </div>

          {/* Focus topics */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Anything specific to focus on? <span className="font-normal text-[var(--text-tertiary)]">(optional)</span></label>
            <textarea
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value.slice(0, 500))}
              placeholder="e.g. Integration by parts, L'Hôpital's rule, Chapter 5 only..."
              rows={3}
              maxLength={500}
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md, 12px)",
                padding: "12px 16px",
                font: "inherit",
                resize: "vertical",
                minHeight: "80px",
                fontSize: "14px",
                transition: "border-color 150ms ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px rgba(255,176,117,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
            {focusTopics.length > 400 && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1 text-right">{focusTopics.length}/500</p>
            )}
          </div>

          {/* Collection selector (if collections exist) */}
          {collections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Source materials</label>
              <CollectionSelector
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onChange={onCollectionChange}
              />
            </div>
          )}

          {/* Actions */}
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
  collections,
  selectedCollectionId,
  onCollectionChange,
}: {
  courseId: string;
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionChange: (id: string | null) => void;
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
          <CollectionSelector collections={collections} selectedCollectionId={selectedCollectionId} onChange={onCollectionChange} />
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
          <CollectionSelector collections={collections} selectedCollectionId={selectedCollectionId} onChange={onCollectionChange} />
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
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Source</label>
            <CollectionSelector collections={collections} selectedCollectionId={selectedCollectionId} onChange={onCollectionChange} />
          </div>
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
