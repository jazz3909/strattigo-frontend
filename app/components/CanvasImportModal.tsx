"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import {
  getCanvasCourses,
  getCanvasModules,
  importCanvasModules,
  type CanvasCourse,
  type CanvasModule,
  type CanvasImportModule,
  type Material,
} from "../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface ModuleState {
  module_id: number;
  module_name: string;
  collection_name: string;
  selected_files: Set<number>;
  expanded: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onImportComplete: () => void;
  existingMaterials: Material[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function FileTypeIcon({ contentType, name }: { contentType: string; name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf" || contentType.includes("pdf");
  const isDoc = ext === "docx" || ext === "doc" || contentType.includes("word");
  const isPpt = ext === "pptx" || ext === "ppt" || contentType.includes("presentation") || contentType.includes("powerpoint");
  const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || contentType.startsWith("image/");

  if (isPdf) return (
    <span style={{ color: "#ef4444" }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </span>
  );
  if (isDoc) return (
    <span style={{ color: "#3b82f6" }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </span>
  );
  if (isPpt) return (
    <span style={{ color: "#f97316" }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    </span>
  );
  if (isImg) return (
    <span style={{ color: "#8b5cf6" }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </span>
  );
  return (
    <span style={{ color: "var(--text-tertiary)" }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  // Map internal steps to 3 visible stages
  const stage = step <= 1 ? 1 : step <= 2 ? 2 : 3;
  const labels = ["Select Course", "Choose Files", "Import"];
  return (
    <div className="flex items-center gap-2 mb-5">
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = stage === idx;
        const done = stage > idx;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  background: done ? "var(--accent)" : active ? "var(--accent)" : "var(--surface-2)",
                  color: done || active ? "#0a0a0f" : "var(--text-tertiary)",
                }}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : idx}
              </div>
              <span
                className="text-xs font-semibold hidden sm:block"
                style={{ color: active ? "var(--text-primary)" : done ? "var(--accent)" : "var(--text-tertiary)" }}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className="flex-1 h-0.5 w-8 rounded-full"
                style={{ background: done ? "var(--accent)" : "var(--surface-2)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styled checkbox
// ─────────────────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, indeterminate }: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
      style={{
        background: checked || indeterminate ? "var(--accent)" : "var(--surface-3)",
        border: checked || indeterminate ? "none" : "1.5px solid var(--border)",
      }}
    >
      {indeterminate ? (
        <svg className="w-2.5 h-2.5" fill="none" stroke="#0a0a0f" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M5 12h14" />
        </svg>
      ) : checked ? (
        <svg className="w-2.5 h-2.5" fill="none" stroke="#0a0a0f" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : null}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function CanvasImportModal({ isOpen, onClose, courseId, onImportComplete, existingMaterials }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 — courses
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Step 2 — modules
  const [modules, setModules] = useState<CanvasModule[]>([]);
  const [moduleStates, setModuleStates] = useState<ModuleState[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState("");

  // Step 4 — import
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{
    imported: { file_name: string; collection_name: string }[];
    skipped: { file_name: string; reason: string }[];
    failed: { file_name: string; error: string }[];
  } | null>(null);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCourses([]);
      setCoursesLoading(false);
      setCoursesError("");
      setSelectedCourseId(null);
      setModules([]);
      setModuleStates([]);
      setModulesLoading(false);
      setModulesError("");
      setImporting(false);
      setImportProgress(0);
      setImportError("");
      setImportResult(null);
    }
  }, [isOpen]);

  // Load courses on open
  useEffect(() => {
    if (isOpen && step === 1 && courses.length === 0 && !coursesLoading && !coursesError) {
      loadCourses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  async function loadCourses() {
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const data = await getCanvasCourses();
      setCourses(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load courses";
      if (/404|not connected|connect/i.test(msg)) {
        setCoursesError("Canvas is not connected. Go to Settings → Canvas to connect your account.");
      } else {
        setCoursesError(msg);
      }
    } finally {
      setCoursesLoading(false);
    }
  }

  async function handleNextFromStep1() {
    if (!selectedCourseId) return;
    setStep(2);
    setModulesLoading(true);
    setModulesError("");
    try {
      const data = await getCanvasModules(selectedCourseId);
      setModules(data);
      setModuleStates(
        data.map((m) => ({
          module_id: m.module_id,
          module_name: m.module_name,
          collection_name: m.suggested_collection_name,
          selected_files: new Set(m.items.map((i) => i.file_id)),
          expanded: true,
        }))
      );
    } catch (err) {
      setModulesError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setModulesLoading(false);
    }
  }

  // ── Module / file selection helpers ──────────────────────────────────────

  const totalSelected = moduleStates.reduce((acc, m) => acc + m.selected_files.size, 0);
  const modulesWithFiles = moduleStates.filter((m) => m.selected_files.size > 0).length;

  const existingNames = new Set(existingMaterials.map((m) => m.file_name));
  const duplicateFiles = moduleStates.flatMap((ms) => {
    const mod = modules.find((m) => m.module_id === ms.module_id);
    if (!mod) return [];
    return mod.items
      .filter((item) => ms.selected_files.has(item.file_id) && existingNames.has(item.display_name))
      .map((item) => item.display_name);
  });

  function toggleModuleExpand(moduleId: number) {
    setModuleStates((prev) =>
      prev.map((m) => (m.module_id === moduleId ? { ...m, expanded: !m.expanded } : m))
    );
  }

  function toggleModuleAllFiles(moduleId: number) {
    setModuleStates((prev) =>
      prev.map((m) => {
        if (m.module_id !== moduleId) return m;
        const mod = modules.find((mod) => mod.module_id === moduleId);
        if (!mod) return m;
        const allSelected = m.selected_files.size === mod.items.length;
        return {
          ...m,
          selected_files: allSelected ? new Set() : new Set(mod.items.map((i) => i.file_id)),
        };
      })
    );
  }

  function toggleFile(moduleId: number, fileId: number) {
    setModuleStates((prev) =>
      prev.map((m) => {
        if (m.module_id !== moduleId) return m;
        const next = new Set(m.selected_files);
        if (next.has(fileId)) next.delete(fileId);
        else next.add(fileId);
        return { ...m, selected_files: next };
      })
    );
  }

  function updateCollectionName(moduleId: number, name: string) {
    setModuleStates((prev) =>
      prev.map((m) => (m.module_id === moduleId ? { ...m, collection_name: name } : m))
    );
  }

  function selectAll() {
    setModuleStates((prev) =>
      prev.map((m) => {
        const mod = modules.find((mod) => mod.module_id === m.module_id);
        if (!mod) return m;
        return { ...m, selected_files: new Set(mod.items.map((i) => i.file_id)) };
      })
    );
  }

  function deselectAll() {
    setModuleStates((prev) => prev.map((m) => ({ ...m, selected_files: new Set<number>() })));
  }

  function handleNextFromStep2() {
    if (totalSelected === 0) return;
    if (duplicateFiles.length > 0) {
      setStep(3);
    } else {
      doImport(false);
    }
  }

  async function doImport(overwrite: boolean) {
    setStep(4);
    setImporting(true);
    setImportProgress(0);
    setImportError("");

    const modulesToImport: CanvasImportModule[] = moduleStates
      .filter((m) => m.selected_files.size > 0)
      .map((m) => ({
        module_id: m.module_id,
        collection_name: m.collection_name.trim() || m.module_name,
        file_ids: Array.from(m.selected_files),
      }));

    const progressInterval = setInterval(() => {
      setImportProgress((p) => Math.min(p + 3, 88));
    }, 400);

    try {
      const result = await importCanvasModules(courseId, modulesToImport, overwrite);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      await new Promise((r) => setTimeout(r, 400));
      setStep(5);
    } catch (err) {
      clearInterval(progressInterval);
      setImportError(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const canClose = !importing;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={isOpen}
      onClose={canClose ? onClose : () => {}}
      hideCloseButton={!canClose}
      size="lg"
    >
      <StepIndicator step={step} />

      {/* ── STEP 1: SELECT CANVAS COURSE ── */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Import from Canvas
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Select a Canvas course to import materials from
          </p>

          {coursesLoading && (
            <div className="flex items-center justify-center py-10 gap-3">
              <Spinner />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading courses…</span>
            </div>
          )}

          {coursesError && (
            <div
              className="rounded-xl px-4 py-3.5 text-sm mb-5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
            >
              {coursesError}
            </div>
          )}

          {!coursesLoading && !coursesError && courses.length === 0 && (
            <div className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>
              <p className="text-sm">No active Canvas courses found.</p>
            </div>
          )}

          {!coursesLoading && courses.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-5">
              {courses.map((course) => {
                const active = selectedCourseId === course.canvas_id;
                return (
                  <button
                    key={course.canvas_id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.canvas_id)}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: active ? "var(--accent-dim)" : "var(--surface-2)",
                      border: `1.5px solid ${active ? "var(--accent)" : "transparent"}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                      {course.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {course.course_code}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedCourseId}
              onClick={handleNextFromStep1}
              rightIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: SELECT MODULES + FILES ── */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Select modules to import
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Each module becomes a collection. Edit collection names inline.
          </p>

          {modulesLoading && (
            <div className="flex items-center justify-center py-10 gap-3">
              <Spinner />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading modules…</span>
            </div>
          )}

          {modulesError && (
            <div
              className="rounded-xl px-4 py-3.5 text-sm mb-5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
            >
              {modulesError}
            </div>
          )}

          {!modulesLoading && !modulesError && modules.length === 0 && (
            <div className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>
              <p className="text-sm">No modules with files found in this course.</p>
            </div>
          )}

          {!modulesLoading && modules.length > 0 && (
            <>
              {/* Controls row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                    style={{ color: "var(--accent)", background: "var(--accent-dim)" }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                    style={{ color: "var(--text-secondary)", background: "var(--surface-2)" }}
                  >
                    Deselect All
                  </button>
                </div>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {totalSelected} file{totalSelected !== 1 ? "s" : ""} across {modulesWithFiles} module{modulesWithFiles !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Module list */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mb-5">
                {moduleStates.map((ms) => {
                  const mod = modules.find((m) => m.module_id === ms.module_id);
                  if (!mod) return null;
                  const allChecked = ms.selected_files.size === mod.items.length;
                  const someChecked = ms.selected_files.size > 0 && !allChecked;

                  return (
                    <div
                      key={ms.module_id}
                      className="rounded-xl overflow-hidden"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      {/* Module header */}
                      <div className="flex items-center gap-2.5 px-3.5 py-3">
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={() => toggleModuleAllFiles(ms.module_id)}
                        />
                        <button
                          type="button"
                          className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleModuleExpand(ms.module_id)}
                        >
                          <span className="text-sm font-semibold truncate text-left" style={{ color: "var(--text-primary)" }}>
                            {ms.module_name}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                            style={{ background: "var(--surface-3)", color: "var(--text-tertiary)" }}
                          >
                            {mod.items.length} file{mod.items.length !== 1 ? "s" : ""}
                          </span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${ms.expanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {/* Editable collection name */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: "var(--text-tertiary)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                          <input
                            type="text"
                            value={ms.collection_name}
                            onChange={(e) => updateCollectionName(ms.module_id, e.target.value)}
                            maxLength={60}
                            className="text-xs px-2 py-1 rounded-lg w-32 outline-none"
                            style={{
                              background: "var(--surface-3)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                            }}
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--accent)"; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
                          />
                        </div>
                      </div>

                      {/* Expanded file list */}
                      {ms.expanded && (
                        <div style={{ borderTop: "1px solid var(--border)" }}>
                          {mod.items.map((item) => (
                            <div
                              key={item.file_id}
                              className="flex items-center gap-2.5 pl-10 pr-3.5 py-2.5 hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                              onClick={() => toggleFile(ms.module_id, item.file_id)}
                            >
                              <Checkbox
                                checked={ms.selected_files.has(item.file_id)}
                                onChange={() => toggleFile(ms.module_id, item.file_id)}
                              />
                              <FileTypeIcon contentType={item.content_type} name={item.display_name} />
                              <span className="flex-1 text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                {item.display_name}
                                {existingNames.has(item.display_name) && (
                                  <span
                                    className="ml-1.5 text-xs px-1.5 py-0.5 rounded font-medium"
                                    style={{ background: "rgba(251,191,36,0.1)", color: "#f59e0b" }}
                                  >
                                    exists
                                  </span>
                                )}
                              </span>
                              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                                {formatSize(item.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Back</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={totalSelected === 0}
              onClick={handleNextFromStep2}
              rightIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              }
            >
              Import {totalSelected > 0 ? `${totalSelected} file${totalSelected !== 1 ? "s" : ""}` : ""} →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: DUPLICATE CHECK ── */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Some files already exist
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {duplicateFiles.length} file{duplicateFiles.length !== 1 ? "s" : ""} already exist in this course:
          </p>

          <div
            className="rounded-xl p-3 mb-5 max-h-40 overflow-y-auto"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {duplicateFiles.map((name) => (
              <div key={name} className="flex items-center gap-2 py-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={() => doImport(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left"
              style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Skip duplicates</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Import only new files, leave existing ones unchanged</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => doImport(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left"
              style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
                <svg className="w-4 h-4" style={{ color: "var(--danger)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Overwrite existing</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Replace all existing files with the Canvas versions</p>
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>← Back</Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: IMPORTING ── */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {importing ? "Importing files…" : importError ? "Import failed" : "Finishing up…"}
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            {importing
              ? "Please wait — downloading and processing files."
              : importError
              ? importError
              : "Almost done!"}
          </p>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {importing ? "Processing…" : importProgress >= 100 ? "Complete" : "Finishing…"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{importProgress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${importProgress}%`,
                  background: importError ? "var(--danger)" : "var(--accent)",
                }}
              />
            </div>
          </div>

          {importing && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <Spinner size="sm" />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Downloading, processing, and generating embeddings…
              </span>
            </div>
          )}

          {importError && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setStep(2); setImportError(""); }}
            >
              ← Back to selection
            </Button>
          )}
        </div>
      )}

      {/* ── STEP 5: COMPLETE ── */}
      {step === 5 && importResult && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-dim)" }}
            >
              <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Import complete!</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your files have been imported.</p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 mb-5">
            {importResult.imported.length > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: "#10b981" }}>
                  {importResult.imported.length} file{importResult.imported.length !== 1 ? "s" : ""} imported
                </span>
              </div>
            )}
            {importResult.skipped.length > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                  {importResult.skipped.length} file{importResult.skipped.length !== 1 ? "s" : ""} skipped (already existed)
                </span>
              </div>
            )}
            {importResult.failed.length > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: "var(--danger)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                  {importResult.failed.length} file{importResult.failed.length !== 1 ? "s" : ""} failed
                </span>
              </div>
            )}
          </div>

          {/* Collections created */}
          {importResult.imported.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-tertiary)" }}>
                COLLECTIONS CREATED/UPDATED
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(importResult.imported.map((i) => i.collection_name))].map((name) => (
                  <span
                    key={name}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => {
              onClose();
              onImportComplete();
            }}
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
