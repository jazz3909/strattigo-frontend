"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  canvasConnect,
  canvasDisconnect,
  getCanvasAssignments,
  getCanvasGrades,
  getToken,
} from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../providers/ToastProvider";

interface Assignment {
  id?: string | number;
  name?: string;
  title?: string;
  due_at?: string;
  due_date?: string;
  points_possible?: number;
  course_name?: string;
  [key: string]: unknown;
}

interface Grade {
  id?: string | number;
  course_name?: string;
  course?: string;
  grade?: string;
  score?: number | string;
  final_grade?: string;
  current_grade?: string;
  [key: string]: unknown;
}

export default function CanvasSettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [domain, setDomain] = useState("");
  const [token, setToken2] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadSettings();
  }, [router]);

  async function loadSettings() {
    try {
      const data = await getCanvasAssignments<Assignment[] | { assignments?: Assignment[] }>();
      // If we got data back (not an error), Canvas is connected
      const list = Array.isArray(data) ? data : (data as { assignments?: Assignment[] }).assignments ?? [];
      setAssignments(list);
      setIsConnected(true);
      fetchGrades();
    } catch {
      // 404 or any error means not connected — show the form
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGrades() {
    setDataLoading(true);
    try {
      const data = await getCanvasGrades<Grade[] | { grades?: Grade[] }>();
      const list = Array.isArray(data) ? data : (data as { grades?: Grade[] }).grades ?? [];
      setGrades(list);
    } catch {
      // grades failing doesn't break the page
    } finally {
      setDataLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await canvasConnect(domain.trim(), token.trim());
      setIsConnected(true);
      addToast("Canvas connected successfully!", "success");
      // Load data now that we're connected
      setLoading(true);
      await loadSettings();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to connect Canvas.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setSaving(true);
    try {
      await canvasDisconnect();
      setDomain("");
      setToken2("");
      setIsConnected(false);
      setAssignments([]);
      setGrades([]);
      addToast("Canvas disconnected.", "info");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to disconnect.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to courses
      </Link>

      {/* Page header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Canvas LMS</h1>
            {!loading && (
              <Badge variant={isConnected ? "green" : "gray"} dot>
                {isConnected ? "Connected" : "Not connected"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Connect your Canvas account to automatically import course materials.
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </Card>
      ) : isConnected ? (
        <>
          {/* Connected status bar */}
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">Canvas is connected</p>
              <p className="text-xs text-emerald-600">Your assignments and grades are synced below.</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDisconnect}
              loading={saving}
            >
              Disconnect
            </Button>
          </div>

          {/* Assignments */}
          <Card className="mb-5">
            <h2 className="text-base font-bold text-slate-800 mb-4">Assignments</h2>
            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No assignments found.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {assignments.map((a, i) => {
                  const name = a.name || a.title || "Untitled";
                  const due = a.due_at || a.due_date;
                  const dueLabel = due ? new Date(due).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
                  const points = a.points_possible != null ? `${a.points_possible} pts` : null;
                  return (
                    <li key={a.id ?? i} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                        {a.course_name && (
                          <p className="text-xs text-slate-400">{a.course_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-500">
                        {dueLabel && <span>Due {dueLabel}</span>}
                        {points && <span className="bg-slate-100 rounded-lg px-2 py-0.5 font-medium">{points}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Grades */}
          <Card>
            <h2 className="text-base font-bold text-slate-800 mb-4">Grades</h2>
            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : grades.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No grades found.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {grades.map((g, i) => {
                  const course = g.course_name || g.course || "Unknown course";
                  const grade = g.final_grade || g.current_grade || g.grade || (g.score != null ? String(g.score) : null);
                  return (
                    <li key={g.id ?? i} className="flex items-center justify-between gap-4 py-3">
                      <p className="text-sm font-medium text-slate-800 truncate">{course}</p>
                      {grade ? (
                        <span className="flex-shrink-0 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-0.5">
                          {grade}
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-xs text-slate-400">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      ) : (
        <>
          {/* Connection form */}
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Canvas Domain"
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="your-school.instructure.com"
                helperText="Your institution's Canvas domain (without https://)"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                }
              />

              <div className="space-y-1.5">
                <label htmlFor="canvas-token" className="block text-sm font-medium text-slate-700">
                  API Token
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </span>
                  <input
                    id="canvas-token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken2(e.target.value)}
                    placeholder="Your Canvas API token"
                    className="w-full pl-10 pr-12 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showToken ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Generate in Canvas → Account → Settings → New Access Token</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={saving}
                  disabled={!domain.trim() || !token.trim()}
                  leftIcon={!saving ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : undefined}
                >
                  Connect Canvas
                </Button>
              </div>
            </form>
          </Card>

          {/* Info card */}
          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">What Canvas integration does</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Connecting Canvas allows Strattigo to automatically import your course materials, so you don't have to upload them manually.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-bold text-blue-800 mb-2">How to get your Canvas API token:</p>
              <ol className="text-xs text-blue-700 space-y-1.5 list-none">
                {[
                  "Log in to your Canvas account",
                  "Click your avatar (top-left) → Account → Settings",
                  "Scroll to Approved Integrations",
                  "Click + New Access Token",
                  'Enter "Strattigo" as purpose and click Generate',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
