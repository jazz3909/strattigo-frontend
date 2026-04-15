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
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input, Textarea } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../providers/ToastProvider";

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const shimmerStyle = `
  @keyframes borderTrace {
    0%   { background-position: 200% 0%; }
    100% { background-position: -200% 0%; }
  }
  .card-shimmer {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(
      270deg,
      transparent 0%,
      transparent 30%,
      rgba(255,255,255,0.0) 38%,
      rgba(255,255,255,0.9) 50%,
      rgba(220,220,255,0.7) 56%,
      rgba(255,255,255,0.0) 62%,
      transparent 70%,
      transparent 100%
    );
    background-size: 200% 100%;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0;
    animation: borderTrace 2.4s linear infinite;
    animation-play-state: paused;
    transition: opacity 0ms ease;
  }
  .card-shimmer.active {
    opacity: 1;
    animation-play-state: running;
  }
  .card-inner-border {
    position: absolute;
    inset: 3px;
    border-radius: 21px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    pointer-events: none;
    transition: border-color 300ms ease;
  }
  .card-inner-border.active {
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-4/5 mb-4" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
  );
}


function CourseCard({ course, index }: { course: Course; index: number }) {
  const [hovered, setHovered] = useState(false);
  const gradient = courseGradient(course.name);

  const baseStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.01)',
    backdropFilter: 'blur(6px) saturate(120%)',
    WebkitBackdropFilter: 'blur(6px) saturate(120%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
    transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
    position: 'relative',
    padding: '32px',
    animationDelay: `${index * 60}ms`,
    overflow: 'hidden',
  };

  const hoverStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
    transform: 'translateY(-4px) scale(1.03)',
  };

  return (
    <Link
      href={`/dashboard/${course.id}`}
      className="block animate-fade-in-up"
      style={hovered ? { ...baseStyle, ...hoverStyle } : baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top highlight line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
        pointerEvents: 'none',
        borderRadius: '1px',
      }} />
      {/* Border shimmer trace */}
      <div className={`card-shimmer ${hovered ? 'active' : ''}`} />
      {/* Inner border ring */}
      <div className={`card-inner-border ${hovered ? 'active' : ''}`} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg transition-all duration-200`}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              flexShrink: 0,
              boxShadow: hovered
                ? "0 4px 20px rgba(225,148,133,0.35)"
                : "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {course.name[0]?.toUpperCase() ?? "C"}
          </div>
          <Badge variant="purple" size="sm" className={`transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
            Open →
          </Badge>
        </div>

        {/* Info */}
        <div>
          <h2
            className="line-clamp-1 mb-1.5"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-fraunces)",
              fontWeight: 700,
              fontSize: "20px",
            }}
          >
            {course.name}
          </h2>
          {course.description ? (
            <p className="text-sm line-clamp-2 leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {course.description}
            </p>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="flex items-center gap-1.5" style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.created_at
                ? new Date(course.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Recently added"}
            </span>
            <span className="flex items-center gap-1" style={{ color: "var(--accent)", fontWeight: 600, fontSize: "13px" }}>
              Study now →
            </span>
          </div>
        </div>
      </div>
    </Link>
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

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const e = getEmail();
    if (e) setEmail(e);
    setGreeting(getGreeting());
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
    setShowModal(true);
  }

  const displayName = email.split("@")[0] || email;

  return (
    <>
      <style>{shimmerStyle}</style>
      <div style={{ position: 'relative', overflow: 'visible' }}>

      {/* Greeting header */}
      <div className="mb-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <Avatar name={email || "User"} size="md" />
            <div>
              <h1
                className="text-2xl sm:text-3xl tracking-tight leading-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-fraunces)", fontWeight: 800 }}
              >
                {greeting ? (
                  <>{greeting}, <span style={{ color: "var(--accent)" }}>{displayName}</span>!</>
                ) : (
                  <>Hi, <span style={{ color: "var(--accent)" }}>{displayName}</span>!</>
                )}
              </h1>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={openModal}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Add Course
          </Button>
        </div>

      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ position: 'relative', zIndex: 1 }}>
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4" style={{ position: 'relative', zIndex: 1 }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-sm flex-1">{error}</span>
          <button onClick={fetchCourses} className="text-sm font-semibold underline hover:no-underline ml-2 flex-shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center" style={{ position: 'relative', zIndex: 1 }}>
          <div
            className="relative w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{
              background: "var(--accent-dim)",
              boxShadow: "0 0 40px rgba(255,176,117,0.25), 0 0 80px rgba(255,176,117,0.1)",
            }}
          >
            <svg className="w-10 h-10" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping" style={{ background: "rgba(255,176,117,0.4)" }} />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full" style={{ background: "var(--accent)" }} />
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>Start your first course</h2>
          <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            Add a course and upload your materials — Strattigo will generate study guides, quizzes, and more instantly.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={openModal}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Add your first course
          </Button>
        </div>
      )}

      {/* Course grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}


      {/* Add Course Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add a new course"
        description="Give your course a name to get started with AI-powered studying."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {createError}
            </div>
          )}

          <Input
            label="Course name"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Organic Chemistry"
            autoFocus
            helperText={`${newName.length}/100 characters`}
            maxLength={100}
          />

          <Textarea
            label="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
            placeholder="Brief description of this course (optional)"
            helperText="Optional — helps the AI understand your course context"
          />

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={creating}
              disabled={!newName.trim()}
            >
              Create course
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </>
  );
}
