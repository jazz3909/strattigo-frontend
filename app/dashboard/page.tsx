"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCourses,
  createCourse,
  Course,
  getToken,
  getEmail,
} from "../lib/api";
import { useToast } from "../providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Callout } from "@/components/ui/callout";
import {
  SUBJECT_COLORS,
  type SubjectColor,
  resolveCourseColor,
  setStoredCourseColor,
} from "@/components/shell/course-color";
import { cn } from "@/lib/utils";

/**
 * Dashboard home — dashboard.html "The shelf".
 * Courses as warm cream cards with a subject-color spine + tile (identity
 * only; every action stays accent). No jump-back-in card: courses carry no
 * recency signal (only created_at), and we don't fabricate one.
 */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** "Monday · July 13" */
function getDateline(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const date = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return `${weekday} · ${date}`;
}

/** Relative "added …" label from created_at. */
function addedLabel(iso?: string): string {
  if (!iso) return "added recently";
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "added today";
  if (days === 1) return "added yesterday";
  if (days < 30) return `added ${days} days ago`;
  const sameYear = then.getFullYear() === new Date().getFullYear();
  return `added ${then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  })}`;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ButtonSpinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0110 10h-3a7 7 0 00-7-7V2z" />
    </svg>
  );
}

function CourseCard({ course }: { course: Course }) {
  const hue = resolveCourseColor(course.id);
  return (
    <Link
      href={`/dashboard/${course.id}/chat`}
      // Force a FULL-route prefetch. The workspace is a dynamic segment with a
      // loading.tsx, so the default ("auto") prefetch stops at the skeleton
      // boundary and the ~409KB markdown/KaTeX chat chunk downloads cold on
      // click — stacking in front of the data fetch. prefetch warms that chunk
      // while the card sits in the viewport, so the click is chunk-warm.
      prefetch
      className="lift-hover group flex overflow-hidden rounded-lg border border-rule bg-raised hover:border-rule-strong"
    >
      <span className="w-[5px] shrink-0" style={{ background: hue.color }} />
      <div className="flex min-w-0 flex-1 flex-col p-[18px] pb-4">
        <div className="mb-3.5 flex items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-[10px] font-display text-[19px] font-semibold text-white"
            style={{ background: hue.color }}
          >
            {course.name[0]?.toUpperCase() ?? "C"}
          </span>
          <h3 className="line-clamp-2 font-display text-[16.5px] leading-[1.15] font-medium text-ink">
            {course.name}
          </h3>
        </div>
        {/* Backend courses carry no description today (silently dropped on
            create) — render it if it ever appears. */}
        {course.description && (
          <p className="mb-4 line-clamp-2 font-read text-[14.5px] leading-[1.45] text-ink-soft">
            {course.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="font-sans text-xs text-ink-faint">{addedLabel(course.created_at)}</span>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1 font-sans text-ui-s font-medium text-accent-deep opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            Study now →
          </span>
        </div>
      </div>
    </Link>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-lg border border-rule bg-raised">
      <span className="w-[5px] shrink-0 bg-sunk" />
      <div className="flex-1 p-[18px]">
        <div className="mb-4 flex items-center gap-3">
          <span className="skeleton-sheen size-10 rounded-[10px] bg-sunk" />
          <span className="h-4 w-2/3 rounded bg-sunk skeleton-sheen" />
        </div>
        <div className="h-3 w-1/3 rounded bg-sunk skeleton-sheen" />
      </div>
    </div>
  );
}

function AddCourseTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border-[1.5px] border-dashed border-rule-strong text-ink-faint transition-colors hover:border-accent hover:bg-accent-tint hover:text-accent-deep"
    >
      <span className="grid size-9 place-items-center rounded-full bg-sunk transition-colors group-hover:bg-accent-tint2">
        <PlusIcon className="size-4" />
      </span>
      <span className="font-sans text-[13.5px] font-medium">Add course</span>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [email, setEmail] = useState("");
  const [greeting, setGreeting] = useState("");
  const [dateline, setDateline] = useState("");
  const [newColor, setNewColor] = useState<SubjectColor>(SUBJECT_COLORS[0]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const e = getEmail();
    if (e) setEmail(e);
    setGreeting(getGreeting());
    setDateline(getDateline());
    fetchCourses();
  }, [router]);

  async function fetchCourses() {
    setLoading(true);
    setError("");
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const course = await createCourse(newName.trim(), newDesc.trim() || undefined);
      // The chosen shelf color is a client-side presentation preference —
      // no backend column exists (FUTURE-ENHANCEMENTS.md).
      setStoredCourseColor(course.id, newColor.key);
      setCourses((prev) => [course, ...prev]);
      setShowModal(false);
      setNewName("");
      setNewDesc("");
      addToast(`"${course.name}" created!`, "success");
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create course.");
    } finally {
      setCreating(false);
    }
  }

  function openModal() {
    setNewName("");
    setNewDesc("");
    setCreateError("");
    // Default swatch: cycle the palette by shelf size so consecutive new
    // courses land on different hues.
    setNewColor(SUBJECT_COLORS[courses.length % SUBJECT_COLORS.length]);
    setShowModal(true);
  }

  // Close the modal on Escape.
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  const displayName = email.split("@")[0] || email;

  return (
    <>
      {/* Editorial header */}
      {/* Greeting fades up once per load — the only page-level entrance. */}
      <div className="rise-in mb-9 flex flex-wrap items-end gap-4">
        <div>
          {dateline && (
            <div className="mb-3 font-sans text-eyebrow font-semibold tracking-[0.08em] text-accent-deep uppercase">
              {dateline}
            </div>
          )}
          <h1 className="mb-3 font-display text-[32px] leading-[1.05] font-semibold tracking-[-0.015em] text-ink sm:text-[40px]">
            {greeting || "Welcome back"}
            {displayName ? `, ${displayName}` : ""}
          </h1>
          {!loading && !error && (
            <p className="font-read text-read-s text-ink-soft">
              <b className="font-medium text-ink">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </b>
              {courses.length > 0 && " · ready when you are"}
            </p>
          )}
        </div>
        <div className="flex-1" />
        <Button variant="primary" onClick={openModal}>
          <PlusIcon /> Add course
        </Button>
      </div>

      {/* Loading — skeleton shelf */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Callout variant="error" label="Couldn't load your courses">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex-1">{error}</span>
            <Button variant="secondary" onClick={fetchCourses}>
              Retry
            </Button>
          </div>
        </Callout>
      )}

      {/* Empty state */}
      {!loading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <span className="mb-6 grid size-16 place-items-center rounded-xl bg-accent-tint text-accent-deep">
            <svg className="size-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </span>
          <h2 className="mb-3 font-display text-[28px] font-semibold text-ink">Start your first course</h2>
          <p className="mb-7 max-w-[400px] font-read text-[17px] leading-normal text-ink-soft">
            A course is where your materials live and where the AI tutor, study
            guides, and quizzes are grounded. Create one to begin.
          </p>
          <Button variant="primary" onClick={openModal}>
            <PlusIcon /> Add course
          </Button>
        </div>
      )}

      {/* The shelf */}
      {!loading && !error && courses.length > 0 && (
        <>
          <div className="mb-4 flex items-baseline gap-2.5">
            <h2 className="font-display text-[20px] font-semibold text-ink">Your courses</h2>
            <span className="font-sans text-ui-s text-ink-faint">{courses.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <AddCourseTile onClick={openModal} />
          </div>
        </>
      )}

      {/* Add-course modal */}
      {showModal && (
        <div
          className="backdrop-enter fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[rgba(35,33,28,0.32)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-course-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="panel-enter w-full max-w-[480px] overflow-hidden rounded-xl border border-rule bg-sheet shadow-lg">
            <form onSubmit={handleCreate}>
              <div className="px-7 pt-6">
                <div className="mb-2.5 font-sans text-eyebrow font-semibold tracking-[0.08em] text-accent-deep uppercase">
                  New course
                </div>
                <h3 id="add-course-title" className="mb-1.5 font-display text-[23px] font-semibold text-ink">
                  Add a course
                </h3>
                <p className="font-read text-[14.5px] leading-normal text-ink-soft">
                  Name it, then pick a color for its place on your shelf.
                </p>
              </div>

              <div className="space-y-5 px-7 py-5">
                {createError && <Callout variant="error">{createError}</Callout>}

                {/* Live shelf preview — updates as the name and color change */}
                <div className="flex overflow-hidden rounded-lg border border-rule bg-raised">
                  <span className="w-[5px] shrink-0" style={{ background: newColor.color }} />
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className="grid size-[38px] shrink-0 place-items-center rounded-[9px] font-display text-lg font-semibold text-white"
                      style={{ background: newColor.color }}
                    >
                      {newName.trim()[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[16px] font-medium text-ink">
                        {newName.trim() || "Your course"}
                      </span>
                      <span className="block font-sans text-xs text-ink-faint">
                        New course · pick a color below
                      </span>
                    </span>
                  </div>
                </div>

                <Input
                  label="Course name"
                  counter={`${newName.length} / 100`}
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  maxLength={100}
                  autoFocus
                />

                {/* Shelf color — the ten curated subject hues, identity only */}
                <div>
                  <div className="mb-2 font-sans text-ui-s font-medium text-ink-soft">Shelf color</div>
                  <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Shelf color">
                    {SUBJECT_COLORS.map((c) => {
                      const selected = c.key === newColor.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          title={c.name}
                          onClick={() => setNewColor(c)}
                          className={cn(
                            "grid size-[34px] cursor-pointer place-items-center rounded-full border-2 border-transparent text-white transition-transform hover:scale-[1.08]",
                            selected && "border-sheet shadow-[0_0_0_2px_var(--color-ink)]"
                          )}
                          style={{ background: c.color }}
                        >
                          {selected && (
                            <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Textarea
                    label={
                      <>
                        Description <span className="font-normal text-ink-faint">· optional</span>
                      </>
                    }
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Metabolism, enzymes, and the pathways that power the cell."
                  />
                  <p className="mt-2 font-read text-[12.5px] italic text-ink-faint">
                    A short description helps the AI tutor understand your course.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-rule-soft px-7 py-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={creating || !newName.trim()}>
                  {creating && <ButtonSpinner />} Create course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
