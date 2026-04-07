"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createCourse, uploadMaterial, canvasConnect } from "../lib/api";
import { Spinner } from "./ui/Spinner";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

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
              style={{
                width: isActive ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: isActive
                  ? "var(--accent)"
                  : isCompleted
                  ? "rgba(255,176,117,0.4)"
                  : "var(--surface-3)",
                transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
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
        <span
          style={{
            fontSize: "32px",
            color: "var(--accent)",
            filter: "drop-shadow(0 0 12px rgba(255,176,117,0.5))",
            display: "inline-block",
          }}
        >
          ✦
        </span>
      </div>

      {/* Heading */}
      <h2 style={{ fontWeight: 800, fontSize: "28px", color: "var(--text-primary)", marginBottom: "12px" }}>
        Welcome to Strattigo
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.6, marginBottom: "28px" }}>
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ color: "var(--accent)", fontSize: "13px" }}>{pill.icon}</span>
            {pill.label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full btn-press"
        style={{
          background: "var(--accent)",
          color: "#0a0a0f",
          fontWeight: 700,
          fontSize: "16px",
          padding: "16px",
          borderRadius: "14px",
          border: "none",
          cursor: "pointer",
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Get Started →
      </button>

      <button
        onClick={onSkip}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-tertiary)",
          fontSize: "13px",
          cursor: "pointer",
          marginTop: "12px",
          textDecoration: "underline",
        }}
      >
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
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--accent-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      </div>

      <h2 style={{ fontWeight: 700, fontSize: "22px", color: "var(--text-primary)", marginBottom: "8px", textAlign: "center" }}>
        Create your first course
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", marginBottom: "24px", lineHeight: 1.6 }}>
        Courses help you organize your materials. Create one for each class you&apos;re taking.
      </p>

      {/* Input */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
          Course name
        </label>
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Calculus 2, Organic Chemistry, History 101"
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {name.length > 40 && (
            <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--text-tertiary)" }}>
              {name.length}/60
            </span>
          )}
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setName(chip)}
            style={{
              padding: "6px 12px",
              background: name === chip ? "var(--accent-dim)" : "var(--surface-2)",
              border: `1px solid ${name === chip ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "8px",
              color: name === chip ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={onBack}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--text-secondary)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          ← Back
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="btn-press"
          style={{
            flex: 1,
            padding: "12px 20px",
            background: !name.trim() ? "var(--surface-3)" : "var(--accent)",
            color: !name.trim() ? "var(--text-tertiary)" : "#0a0a0f",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: !name.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 150ms ease",
          }}
        >
          {loading ? <Spinner size="sm" /> : null}
          Create Course →
        </button>
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={onSkip} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
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
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
      </div>

      <h2 style={{ fontWeight: 700, fontSize: "22px", color: "var(--text-primary)", marginBottom: "8px", textAlign: "center" }}>
        Upload your course materials
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", marginBottom: "24px", lineHeight: 1.6 }}>
        Upload your lecture slides, notes, or textbook chapters. The AI will study them so you don&apos;t have to.
      </p>

      {!uploadedFile ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: dragOver ? "var(--accent-dim)" : "var(--surface-2)",
            transition: "all 200ms ease",
            marginBottom: "16px",
          }}
          className={dragOver ? "drag-active" : ""}
          onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(255,176,117,0.05)"; } }}
          onMouseLeave={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface-2)"; } }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />

          {uploading ? (
            <div>
              <div style={{ marginBottom: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
                Uploading...
              </div>
              <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "var(--accent)",
                    borderRadius: "2px",
                    transition: "width 150ms ease",
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <svg width="32" height="32" fill="none" stroke="var(--text-tertiary)" strokeWidth={1.5} viewBox="0 0 24 24" style={{ margin: "0 auto 12px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "4px" }}>
                Drop files here or click to browse
              </p>
              <p style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                PDF, PPTX, DOCX, TXT, images — up to 25MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(107,255,184,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke="var(--success)" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "var(--success)", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>Material uploaded successfully!</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFile}</p>
          </div>
          <button
            onClick={() => { setUploadedFile(null); setProgress(0); }}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "12px", padding: "6px 10px", cursor: "pointer" }}
          >
            Upload another
          </button>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={onBack}
          style={{ padding: "12px 20px", background: "none", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-secondary)", fontSize: "14px", cursor: "pointer", transition: "all 150ms ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="btn-press"
          style={{ flex: 1, padding: "12px 20px", background: "var(--accent)", color: "#0a0a0f", border: "none", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "opacity 150ms ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Continue →
        </button>
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={onSkip} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
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
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <h2 style={{ fontWeight: 700, fontSize: "22px", color: "var(--text-primary)" }}>
          Connect Canvas LMS
        </h2>
        <span style={{ padding: "2px 10px", background: "var(--surface-3)", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 600, borderRadius: "999px", letterSpacing: "0.04em" }}>
          Optional
        </span>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", marginBottom: "20px", lineHeight: 1.6 }}>
        Connect your Canvas account to automatically import course materials and see your assignment deadlines.
      </p>

      {/* Benefit chips */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
        {["📥 Auto-import files", "📅 Assignment deadlines", "📊 Grade tracking"].map((chip) => (
          <span key={chip} style={{ padding: "6px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
            {chip}
          </span>
        ))}
      </div>

      {connected ? (
        <div style={{ textAlign: "center", padding: "20px", background: "rgba(107,255,184,0.08)", border: "1px solid rgba(107,255,184,0.2)", borderRadius: "12px", marginBottom: "16px" }}>
          <p style={{ color: "var(--success)", fontWeight: 600, fontSize: "16px" }}>✓ Canvas connected!</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>Redirecting...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          {/* Domain */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              Canvas Domain
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourschool.instructure.com"
              style={{ width: "100%", padding: "11px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <p style={{ color: "var(--text-tertiary)", fontSize: "11px", marginTop: "4px" }}>Find this in your browser&apos;s URL when logged into Canvas</p>
          </div>

          {/* Token */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              API Token
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Your Canvas API token"
                style={{ width: "100%", padding: "11px 40px 11px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "2px" }}
              >
                {showToken ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            <p style={{ color: "var(--text-tertiary)", fontSize: "11px", marginTop: "4px" }}>
              Settings → Account → Approved Integrations → New Access Token (max 120 days)
            </p>
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}

          <button
            onClick={handleConnect}
            disabled={!domain.trim() || !token.trim() || loading}
            className="btn-press"
            style={{
              width: "100%",
              padding: "13px",
              background: !domain.trim() || !token.trim() ? "var(--surface-3)" : "var(--accent)",
              color: !domain.trim() || !token.trim() ? "var(--text-tertiary)" : "#0a0a0f",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: !domain.trim() || !token.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 150ms ease",
            }}
          >
            {loading ? <Spinner size="sm" /> : null}
            Connect Canvas
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <button
          onClick={onBack}
          style={{ padding: "10px 16px", background: "none", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer", transition: "all 150ms ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="btn-press"
          style={{ padding: "10px 20px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 150ms ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          Skip for now →
        </button>
      </div>
      <p style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: "12px", marginTop: "10px" }}>
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
        <span className="animate-sparkle-pulse" style={{ fontSize: "48px", display: "inline-block" }}>✦</span>
      </div>

      <h2 style={{ fontWeight: 800, fontSize: "28px", color: "var(--text-primary)", marginBottom: "12px" }}>
        You&apos;re all set! 🎉
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" }}>
        Your study platform is ready. Start by generating a study guide or practice quiz from your materials.
      </p>

      {achievements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px", textAlign: "left" }}>
          {achievements.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(107,255,184,0.06)", border: "1px solid rgba(107,255,184,0.15)", borderRadius: "10px" }}>
              <span style={{ color: "var(--success)", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={() => onDone(true)}
          className="btn-press"
          style={{ width: "100%", padding: "15px", background: "var(--accent)", color: "#0a0a0f", border: "none", borderRadius: "14px", fontWeight: 700, fontSize: "15px", cursor: "pointer", transition: "opacity 150ms ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Start Studying →
        </button>
        <button
          onClick={() => onDone(false)}
          style={{ width: "100%", padding: "13px", background: "none", border: "1px solid var(--border)", borderRadius: "14px", color: "var(--text-secondary)", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 150ms ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
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
    localStorage.setItem("strattigo_onboarding_complete", "true");
    onComplete();
  }

  function handleDone(goToCourse = false) {
    localStorage.setItem("strattigo_onboarding_complete", "true");
    onComplete();
    if (goToCourse && createdCourseId) {
      router.push(`/dashboard/${createdCourseId}`);
    }
  }

  if (!isOpen || !mounted) return null;

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Welcome to Strattigo"
    >
      <div
        style={{
          maxWidth: "560px",
          width: "90vw",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 0 60px rgba(255,176,117,0.08), 0 24px 80px rgba(0,0,0,0.6)",
          animation: "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
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
