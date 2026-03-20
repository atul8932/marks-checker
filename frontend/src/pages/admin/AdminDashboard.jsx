import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminStatCard } from "../../components/admin/AdminStatCard";
import { AdminLoader } from "../../components/admin/AdminLoader";
import { AdminErrorBoundary } from "../../components/admin/AdminErrorBoundary";
import { fetchStats } from "../../api/adminApi";

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await fetchStats();
      setData(d);
      setLastRefresh(new Date().toLocaleTimeString());
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <AdminLayout>
      <AdminErrorBoundary>
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Dashboard</h1>
              <p className="admin-page-sub">
                System overview ·{" "}
                {lastRefresh ? `Last updated ${lastRefresh}` : "Loading…"}
              </p>
            </div>
            <button className="button" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && !data && <AdminLoader message="Loading stats…" />}

          {data && (
            <>
              {/* Primary stats */}
              <div className="admin-stat-grid">
                <AdminStatCard
                  icon="📄"
                  label="Total Results"
                  value={fmt(data.totalResults)}
                  sub="All exams combined"
                  accent="var(--accent)"
                />
                <AdminStatCard
                  icon="📅"
                  label="Uploads Today"
                  value={fmt(data.uploadsToday)}
                  sub="Since midnight"
                  accent="var(--accent-2)"
                />
                <AdminStatCard
                  icon="⚡"
                  label="Active Jobs"
                  value={fmt(data.jobs?.active)}
                  sub="Currently processing"
                  accent="var(--amber)"
                />
                <AdminStatCard
                  icon="❌"
                  label="Failed Jobs"
                  value={fmt(data.jobs?.failed)}
                  sub="Need attention"
                  accent="var(--red)"
                />
                <AdminStatCard
                  icon="✅"
                  label="Completed Jobs"
                  value={fmt(data.jobs?.completed)}
                  sub="All time"
                  accent="var(--green)"
                />
                <AdminStatCard
                  icon="📊"
                  label="Avg Marks"
                  value={data.avgMarks ? data.avgMarks.toFixed(1) : "—"}
                  sub="Across all results"
                  accent="#a78bfa"
                />
                <AdminStatCard
                  icon="⏳"
                  label="Waiting Jobs"
                  value={fmt(data.jobs?.waiting)}
                  sub="In queue"
                  accent="#60a5fa"
                />
                <AdminStatCard
                  icon="🕐"
                  label="Uptime"
                  value={fmtUptime(data.uptimeSeconds)}
                  sub="Server uptime"
                  accent="#34d399"
                />
              </div>

              {/* Per-exam breakdown */}
              <div className="admin-section">
                <h2 className="admin-section-title">Results by Exam</h2>
                <div className="admin-exam-grid">
                  {Object.entries(data.byExam || {}).map(([exam, info]) => (
                    <div key={exam} className="admin-exam-card">
                      <div className="admin-exam-name">{exam.toUpperCase()}</div>
                      <div className="admin-exam-total">{fmt(info.total)}</div>
                      <div className="admin-exam-today">+{info.today} today</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job queue summary */}
              <div className="admin-section">
                <h2 className="admin-section-title">Job Queue</h2>
                <div className="admin-job-summary">
                  {[
                    { label: "Waiting",   value: data.jobs?.waiting,   color: "var(--amber)" },
                    { label: "Active",    value: data.jobs?.active,    color: "var(--accent-2)" },
                    { label: "Completed", value: data.jobs?.completed, color: "var(--green)" },
                    { label: "Failed",    value: data.jobs?.failed,    color: "var(--red)" },
                    { label: "Delayed",   value: data.jobs?.delayed,   color: "var(--muted)" },
                  ].map((s) => (
                    <div key={s.label} className="admin-job-stat">
                      <div className="admin-job-dot" style={{ background: s.color }} />
                      <span className="admin-job-label">{s.label}</span>
                      <span className="admin-job-val">{fmt(s.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </AdminErrorBoundary>
    </AdminLayout>
  );
}
