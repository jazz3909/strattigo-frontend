"use client";

import { useState, useEffect } from "react";

const API_BASE = "/api";

interface AdminStats {
  total_users: number;
  total_courses: number;
  total_materials: number;
  total_generated: number;
}

interface RecentSignup {
  id: string;
  email?: string;
  created_at: string;
}

interface TopUser {
  user_id: string;
  course_count: number;
}

interface RecentCourse {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface DashboardData {
  stats: AdminStats;
  recent_signups: RecentSignup[];
  top_users: TopUser[];
  materials_histogram: Record<string, number>;
  recent_courses: RecentCourse[];
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_key");
    if (stored) {
      setAdminKey(stored);
      fetchDashboard(stored);
    }
  }, []);

  async function fetchDashboard(key: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { "X-Admin-Key": key },
      });
      if (res.status === 403) {
        setError("Invalid admin key");
        sessionStorage.removeItem("admin_key");
        setAdminKey("");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      sessionStorage.setItem("admin_key", key);
      setAdminKey(key);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (inputKey.trim()) fetchDashboard(inputKey.trim());
  }

  if (!adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 20, padding: 40, width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 22, margin: 0 }}>Admin Dashboard</h1>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Enter admin key to continue</p>
            </div>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Admin API key"
              autoFocus
              style={{
                padding: "12px 16px",
                border: "1px solid #1e1e2e",
                borderRadius: 12,
                background: "#0a0a0f",
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; }}
              onBlur={(e) => { e.target.style.borderColor = "#1e1e2e"; }}
            />
            {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={!inputKey.trim() || loading}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                cursor: loading ? "default" : "pointer",
                opacity: !inputKey.trim() || loading ? 0.6 : 1,
              }}
            >
              {loading ? "Loading…" : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <div style={{ color: "#7c3aed", fontSize: 16 }}>Loading dashboard…</div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recent_signups, top_users, materials_histogram, recent_courses } = data;

  const maxHistCount = Math.max(...Object.values(materials_histogram).map(Number), 1);
  const maxTopCount = Math.max(...top_users.map((u) => u.course_count), 1);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f1f5f9", fontFamily: "system-ui,sans-serif" }}>
      {/* Navbar */}
      <div style={{ borderBottom: "1px solid #1e1e2e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>STRATTIGO</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b", background: "#1e1e2e", padding: "2px 8px", borderRadius: 6 }}>Admin</span>
          </div>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("admin_key"); setAdminKey(""); setData(null); }}
          style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #1e1e2e", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>Platform overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Users", value: stats.total_users, color: "#7c3aed", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
            { label: "Total Courses", value: stats.total_courses, color: "#2563eb", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" },
            { label: "Total Materials", value: stats.total_materials, color: "#059669", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
            { label: "AI Generations", value: stats.total_generated, color: "#d97706", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" fill="none" stroke={s.color} strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", margin: 0, lineHeight: 1 }}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* Materials per Course histogram */}
          <div style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Materials per Course</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
              {Object.entries(materials_histogram).sort(([a], [b]) => Number(a) - Number(b)).slice(0, 10).map(([bucket, count]) => (
                <div key={bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{count}</span>
                  <div
                    style={{
                      width: "100%",
                      borderRadius: 6,
                      background: "linear-gradient(to top,#7c3aed,#2563eb)",
                      height: `${(Number(count) / maxHistCount) * 100}px`,
                      minHeight: 4,
                    }}
                  />
                  <span style={{ fontSize: 10, color: "#475569" }}>{bucket}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>X-axis: # of materials in course</p>
          </div>

          {/* Top Users by Course Count */}
          <div style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Top Users by Courses</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {top_users.slice(0, 6).map((u, i) => (
                <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#475569", width: 16, textAlign: "right" }}>#{i + 1}</span>
                  <div style={{ flex: 1, background: "#0a0a0f", borderRadius: 4, overflow: "hidden", height: 20 }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        background: "linear-gradient(to right,#7c3aed,#2563eb)",
                        width: `${(u.course_count / maxTopCount) * 100}%`,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 24, textAlign: "right" }}>{u.course_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Recent Signups */}
          <div style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Recent Signups</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 600, paddingBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email / ID</th>
                  <th style={{ textAlign: "right", fontSize: 11, color: "#475569", fontWeight: 600, paddingBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recent_signups.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: "1px solid #1e1e2e" }}>
                    <td style={{ padding: "10px 0", fontSize: 12, color: "#94a3b8" }}>
                      {u.email ?? u.id.slice(0, 8) + "…"}
                    </td>
                    <td style={{ padding: "10px 0", fontSize: 12, color: "#475569", textAlign: "right" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recent_signups.length === 0 && (
                  <tr><td colSpan={2} style={{ color: "#475569", fontSize: 12, padding: "12px 0" }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Courses */}
          <div style={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Recent Courses</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 600, paddingBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Course</th>
                  <th style={{ textAlign: "right", fontSize: 11, color: "#475569", fontWeight: 600, paddingBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent_courses.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #1e1e2e" }}>
                    <td style={{ padding: "10px 0", fontSize: 12, color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "10px 0", fontSize: 12, color: "#475569", textAlign: "right" }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recent_courses.length === 0 && (
                  <tr><td colSpan={2} style={{ color: "#475569", fontSize: 12, padding: "12px 0" }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
