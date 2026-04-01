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
  getUsageStats,
  UsageStats,
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

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
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

function StatCard({
  icon,
  label,
  value,
  loading,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  loading: boolean;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div>
        {loading ? (
          <>
            <Skeleton className="h-5 w-12 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <p className="text-xl font-extrabold text-slate-900 leading-none">{value ?? "—"}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </>
        )}
      </div>
    </div>
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
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const e = getEmail();
    if (e) setEmail(e);
    setGreeting(getGreeting());
    fetchCourses();
    fetchStats();
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

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const data = await getUsageStats();
      setStats(data);
    } catch {
      // Stats are non-critical — fail silently
      setStats(null);
    } finally {
      setStatsLoading(false);
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
      {/* Greeting header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <Avatar name={email || "User"} size="md" />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {greeting ? `${greeting}, ${displayName}!` : `Hi, ${displayName}!`}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {loading
                  ? "Loading your courses…"
                  : courses.length === 0
                  ? "Add your first course to get started"
                  : `You have ${courses.length} course${courses.length !== 1 ? "s" : ""}`}
              </p>
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            label="Courses"
            value={loading ? null : courses.length}
            loading={loading}
            color="from-violet-500 to-purple-600"
          />
          <StatCard
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            label="Materials"
            value={stats?.materials ?? null}
            loading={statsLoading}
            color="from-blue-500 to-indigo-600"
          />
          <StatCard
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
            label="AI Generations"
            value={stats?.generations ?? null}
            loading={statsLoading}
            color="from-emerald-500 to-teal-600"
          />
        </div>

      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
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
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="No courses yet"
          description="Add your first course to start generating AI-powered study guides, quizzes, and study plans."
          action={
            <Button variant="primary" size="md" onClick={openModal}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Add your first course
            </Button>
          }
          className="py-24"
        />
      )}

      {/* Course grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <Link
              key={course.id}
              href={`/dashboard/${course.id}`}
              className="group block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:border-violet-100 hover:-translate-y-1 transition-all duration-200 animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${courseGradient(course.name)} flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow`}>
                  {course.name[0]?.toUpperCase() ?? "C"}
                </div>
                <Badge variant="purple" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Open →
                </Badge>
              </div>

              {/* Info */}
              <h2 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors mb-1.5 line-clamp-1">
                {course.name}
              </h2>
              {course.description ? (
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {course.description}
                </p>
              ) : (
                <p className="text-sm text-slate-300 italic mb-4">No description</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.created_at
                    ? new Date(course.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Recently added"}
                </span>
                <span className="text-xs font-semibold text-violet-600 group-hover:text-violet-700 flex items-center gap-1 transition-all group-hover:gap-2">
                  Study now
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
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
    </>
  );
}
