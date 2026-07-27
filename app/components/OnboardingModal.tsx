"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createCourse, uploadMaterial, canvasConnect, onboardingCompleteKey } from "../lib/api";
import { Spinner } from "./ui/Spinner";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

// Shared cream field / button classes (mirror components/ui input + button).
const fieldClasses =
  "w-full rounded-sm border border-rule-strong bg-raised px-3 py-2.5 font-sans text-ui text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-tint)]";
const labelClasses = "mb-1.5 block font-sans text-ui-s font-medium text-ink-soft";
const secondaryBtnClasses =
  "cursor-pointer rounded-sm border border-rule-strong bg-transparent font-sans text-ui font-medium text-ink-soft transition-colors hover:bg-rule-soft";
const skipBtnClasses =
  "cursor-pointer border-none bg-transparent font-sans text-[13px] text-ink-faint underline";

// ── Step Indicator ────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-2 mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isActive = step === current;
          const isCompleted = step < current;
          return (
            <div
              key={step}
              className={`h-2 shrink-0 rounded-full transition-all duration-300 ${
                isActive ? "w-6 bg-accent" : isCompleted ? "w-2 bg-accent-tint2" : "w-2 bg-sunk"
              }`}
            />
          );
        })}
      </div>
      <span className="font-sans text-xs font-medium text-ink-faint">
        Step {current} of {total}
      </span>
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────

function Step1Welcome({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="animate-step-enter text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <span className="inline-block text-[32px] text-accent-deep">✦</span>
      </div>

      {/* Heading */}
      <h2 className="mb-3 font-display text-display-m text-ink">
        Welcome to Strattigo
      </h2>
      <p className="mb-7 font-read text-read-s leading-relaxed text-ink-soft">
        Your AI-powered study platform. Let&apos;s get you set up in just a few steps.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { icon: "📚", label: "Study Guides" },
          { icon: "✦", label: "Practice Quizzes" },
          { icon: "💬", label: "AI Tutor" },
        ].map((pill) => (
          <div
            key={pill.label}
            className="flex items-center gap-1.5 rounded-sm border border-rule bg-sunk px-4 py-2 font-sans text-sm text-ink-soft"
          >
            <span className="text-[13px] text-accent-deep">{pill.icon}</span>
            {pill.label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="btn-press w-full cursor-pointer rounded-md border-none bg-accent p-4 font-sans text-[16px] font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Get Started →
      </button>

      <button onClick={onSkip} className={`${skipBtnClasses} mt-3`}>
        Skip setup
      </button>
    </div>
  );
}

// ── Step 2: Create Course ─────────────────────────────────────────────────

function Step2Course({
  onNext,
  onBack,
  onSkip,
  onCourseCreated,
}: {
  onNext: (courseId: string, courseName: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onCourseCreated?: (id: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const CHIPS = ["Calculus 2", "Chemistry", "Statistics", "History"];

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const course = await createCourse(name.trim());
      onCourseCreated?.(course.id, course.name);
      onNext(course.id, course.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create course.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-step-enter">
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="grid size-12 place-items-center rounded-full bg-accent-tint text-accent-deep">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      </div>

      <h2 className="mb-2 text-center font-display text-[22px] font-semibold text-ink">
        Create your first course
      </h2>
      <p className="mb-6 text-center font-read text-[14.5px] leading-relaxed text-ink-soft">
        Courses help you organize your materials. Create one for each class you&apos;re taking.
      </p>

      {/* Input */}
      <div className="mb-3">
        <label className={labelClasses}>Course name</label>
        <div className="relative">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Calculus 2, Organic Chemistry, History 101"
            className={fieldClasses}
          />
          {name.length > 40 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[11px] text-ink-faint">
              {name.length}/60
            </span>
          )}
        </div>
      </div>

      {/* Chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setName(chip)}
            className={`cursor-pointer rounded-sm border px-3 py-1.5 font-sans text-[13px] transition-colors ${
              name === chip
                ? "border-accent bg-accent-tint text-accent-deep"
                : "border-rule-strong bg-raised text-ink-soft hover:bg-rule-soft"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 font-sans text-[13px] text-error">{error}</p>}

      {/* Buttons */}
      <div className="mb-2 flex gap-2">
        <button onClick={onBack} className={`${secondaryBtnClasses} px-5 py-3`}>
          ← Back
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className={`btn-press flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border-none px-5 py-3 font-sans text-ui font-semibold transition-colors ${
            !name.trim()
              ? "cursor-not-allowed bg-sunk text-ink-faint"
              : "bg-accent text-white hover:bg-accent-hover"
          }`}
        >
          {loading ? <Spinner size="sm" className="border-white/40 border-t-white" /> : null}
          Create Course →
        </button>
      </div>
      <div className="text-center">
        <button onClick={onSkip} className={skipBtnClasses}>
          Skip this step
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Upload Material ───────────────────────────────────────────────

function Step3Upload({
  courseId,
  courseName,
  onNext,
  onBack,
  onSkip,
  onFileUploaded,
}: {
  courseId: string | null;
  courseName: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFileUploaded?: (fileName: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [effectiveCourseId, setEffectiveCourseId] = useState<string | null>(courseId);

  useEffect(() => {
    setEffectiveCourseId(courseId);
  }, [courseId]);

  const ACCEPTED = ".pdf,.pptx,.docx,.txt,.jpg,.png,.webp,.csv,.xlsx";

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);
    setProgress(0);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 85));
    }, 150);

    try {
      let cId = effectiveCourseId;
      if (!cId) {
        // Create default course if user skipped step 2
        const course = await createCourse(courseName || "My First Course");
        cId = course.id;
        setEffectiveCourseId(cId);
      }
      await uploadMaterial(cId, file);
      clearInterval(interval);
      setProgress(100);
      setUploadedFile(file.name);
      onFileUploaded?.(file.name);
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="animate-step-enter">
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="grid size-12 place-items-center rounded-full bg-accent-tint text-accent-deep">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
      </div>

      <h2 className="mb-2 text-center font-display text-[22px] font-semibold text-ink">
        Upload your course materials
      </h2>
      <p className="mb-6 text-center font-read text-[14.5px] leading-relaxed text-ink-soft">
        Upload your lecture slides, notes, or textbook chapters. The AI will study them so you don&apos;t have to.
      </p>

      {!uploadedFile ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mb-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent-tint"
              : `border-rule-strong bg-sheet ${uploading ? "" : "cursor-pointer hover:border-accent hover:bg-accent-tint/50"}`
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />

          {uploading ? (
            <div>
              <div className="mb-3 font-sans text-sm text-ink-soft">
                Uploading...
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-sunk">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="mx-auto mb-3 text-ink-faint">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="mb-1 font-sans text-sm text-ink-soft">
                Drop files here or click to browse
              </p>
              <p className="font-sans text-xs text-ink-faint">
                PDF, PPTX, DOCX, TXT, images — up to 50MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-rule bg-raised p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-success-tint text-success">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 font-sans text-[13px] font-semibold text-success">Material uploaded successfully!</p>
            <p className="truncate font-sans text-xs text-ink-soft">{uploadedFile}</p>
          </div>
          <button
            onClick={() => { setUploadedFile(null); setProgress(0); }}
            className="cursor-pointer rounded-sm border border-rule-strong bg-transparent px-2.5 py-1.5 font-sans text-xs text-ink-soft transition-colors hover:bg-rule-soft"
          >
            Upload another
          </button>
        </div>
      )}

      {error && <p className="mb-3 font-sans text-[13px] text-error">{error}</p>}

      <div className="mb-2 flex gap-2">
        <button onClick={onBack} className={`${secondaryBtnClasses} px-5 py-3`}>
          ← Back
        </button>
        <button
          onClick={onNext}
          className="btn-press flex-1 cursor-pointer rounded-sm border-none bg-accent px-5 py-3 font-sans text-ui font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Continue →
        </button>
      </div>
      <div className="text-center">
        <button onClick={onSkip} className={skipBtnClasses}>
          Skip this step
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Connect Canvas ────────────────────────────────────────────────

function Step4Canvas({
  onNext,
  onBack,
  onConnected,
}: {
  onNext: () => void;
  onBack: () => void;
  onConnected?: () => void;
}) {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    if (!domain.trim() || !token.trim()) return;
    setLoading(true);
    setError("");
    try {
      await canvasConnect(domain.trim(), token.trim());
      setConnected(true);
      onConnected?.();
      setTimeout(() => onNext(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect Canvas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-step-enter">
      {/* Icon + title */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="grid size-12 place-items-center rounded-full bg-accent-tint text-accent-deep">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <h2 className="font-display text-[22px] font-semibold text-ink">
          Connect Canvas LMS
        </h2>
        <span className="rounded-full bg-sunk px-2.5 py-0.5 font-sans text-[11px] font-semibold tracking-[0.04em] text-ink-faint">
          Optional
        </span>
      </div>

      <p className="mb-5 text-center font-read text-[14.5px] leading-relaxed text-ink-soft">
        Connect your Canvas account to automatically import course materials and see your assignment deadlines.
      </p>

      {/* Benefit chips */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {["📥 Auto-import files", "📅 Assignment deadlines", "📊 Grade tracking"].map((chip) => (
          <span key={chip} className="rounded-sm border border-rule bg-sunk px-3 py-1.5 font-sans text-[13px] text-ink-soft">
            {chip}
          </span>
        ))}
      </div>

      {connected ? (
        <div className="mb-4 rounded-lg bg-success-tint p-5 text-center">
          <p className="font-sans text-[16px] font-semibold text-success-deep">✓ Canvas connected!</p>
          <p className="mt-1 font-sans text-[13px] text-success-deep">Redirecting...</p>
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {/* Domain */}
          <div>
            <label className={labelClasses}>Canvas Domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourschool.instructure.com"
              className={fieldClasses}
            />
            <p className="mt-1 font-sans text-[11px] text-ink-faint">Find this in your browser&apos;s URL when logged into Canvas</p>
          </div>

          {/* Token */}
          <div>
            <label className={labelClasses}>API Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Your Canvas API token"
                className={`${fieldClasses} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-0.5 text-ink-faint hover:text-ink"
              >
                {showToken ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            <p className="mt-1 font-sans text-[11px] text-ink-faint">
              Settings → Account → Approved Integrations → New Access Token (max 120 days)
            </p>
          </div>

          {error && <p className="font-sans text-[13px] text-error">{error}</p>}

          <button
            onClick={handleConnect}
            disabled={!domain.trim() || !token.trim() || loading}
            className={`btn-press flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border-none p-3 font-sans text-ui font-semibold transition-colors ${
              !domain.trim() || !token.trim()
                ? "cursor-not-allowed bg-sunk text-ink-faint"
                : "bg-accent text-white hover:bg-accent-hover"
            }`}
          >
            {loading ? <Spinner size="sm" className="border-white/40 border-t-white" /> : null}
            Connect Canvas
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button onClick={onBack} className={`${secondaryBtnClasses} px-4 py-2.5 text-[13px]`}>
          ← Back
        </button>
        <button
          onClick={onNext}
          className={`btn-press ${secondaryBtnClasses} px-5 py-2.5 text-[13px] font-semibold`}
        >
          Skip for now →
        </button>
      </div>
      <p className="mt-2.5 text-center font-sans text-xs text-ink-faint">
        You can always connect Canvas later in Settings
      </p>
    </div>
  );
}

// ── Step 5: Complete ──────────────────────────────────────────────────────

function Step5Complete({
  createdCourseName,
  uploadedFileName,
  canvasConnected,
  createdCourseId,
  onDone,
}: {
  createdCourseName: string;
  uploadedFileName: string;
  canvasConnected: boolean;
  createdCourseId: string | null;
  onDone: (goToCourse?: boolean) => void;
}) {
  const achievements = [
    createdCourseName ? { text: `Course created: ${createdCourseName}` } : null,
    uploadedFileName ? { text: `Material uploaded: ${uploadedFileName}` } : null,
    canvasConnected ? { text: "Canvas connected" } : null,
  ].filter(Boolean) as { text: string }[];

  return (
    <div className="animate-step-enter text-center">
      <div className="flex justify-center mb-6">
        <span className="animate-sparkle-pulse inline-block text-[48px] text-accent-deep">✦</span>
      </div>

      <h2 className="mb-3 font-display text-display-m text-ink">
        You&apos;re all set! 🎉
      </h2>
      <p className="mb-6 font-read text-read-s leading-relaxed text-ink-soft">
        Your study platform is ready. Start by generating a study guide or practice quiz from your materials.
      </p>

      {achievements.length > 0 && (
        <div className="mb-7 flex flex-col gap-2 text-left">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-md bg-success-tint px-3.5 py-2.5">
              <span className="shrink-0 font-bold text-success">✓</span>
              <span className="font-sans text-sm text-success-deep">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => onDone(true)}
          className="btn-press w-full cursor-pointer rounded-md border-none bg-accent p-[15px] font-sans text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Start Studying →
        </button>
        <button
          onClick={() => onDone(false)}
          className={`${secondaryBtnClasses} w-full rounded-md p-3 font-semibold`}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stepKey, setStepKey] = useState(0);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdCourseName, setCreatedCourseName] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [canvasConnected, setCanvasConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const goToStep = useCallback((n: number) => {
    setStepKey((k) => k + 1);
    setStep(n);
  }, []);

  const TOTAL_STEPS = 4;

  function handleSkipAll() {
    localStorage.setItem(onboardingCompleteKey(), "true");
    onComplete();
  }

  function handleDone(goToCourse = false) {
    localStorage.setItem(onboardingCompleteKey(), "true");
    onComplete();
    if (goToCourse && createdCourseId) {
      router.push(`/dashboard/${createdCourseId}`);
    }
  }

  if (!isOpen || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-ink/40 p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Welcome to Strattigo"
    >
      <div className="animate-scale-in max-h-[90vh] w-[90vw] max-w-[560px] overflow-y-auto rounded-xl border border-rule bg-sheet p-10 shadow-lg">
        {/* Step indicator only for steps 1-4 */}
        {step <= TOTAL_STEPS && (
          <StepIndicator current={step} total={TOTAL_STEPS} />
        )}

        {/* Step content */}
        <div key={stepKey}>
          {step === 1 && (
            <Step1Welcome
              onNext={() => goToStep(2)}
              onSkip={handleSkipAll}
            />
          )}
          {step === 2 && (
            <Step2Course
              onNext={(id, name) => {
                setCreatedCourseId(id);
                setCreatedCourseName(name);
                goToStep(3);
              }}
              onBack={() => goToStep(1)}
              onSkip={() => goToStep(3)}
              onCourseCreated={(id, name) => {
                setCreatedCourseId(id);
                setCreatedCourseName(name);
              }}
            />
          )}
          {step === 3 && (
            <Step3Upload
              courseId={createdCourseId}
              courseName={createdCourseName}
              onNext={() => goToStep(4)}
              onBack={() => goToStep(2)}
              onSkip={() => goToStep(4)}
              onFileUploaded={(fileName) => setUploadedFileName(fileName)}
            />
          )}
          {step === 4 && (
            <Step4Canvas
              onNext={() => goToStep(5)}
              onBack={() => goToStep(3)}
              onConnected={() => setCanvasConnected(true)}
            />
          )}
          {step === 5 && (
            <Step5Complete
              createdCourseName={createdCourseName}
              uploadedFileName={uploadedFileName}
              canvasConnected={canvasConnected}
              createdCourseId={createdCourseId}
              onDone={handleDone}
            />
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
