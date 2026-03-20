import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminLoader } from "../../components/admin/AdminLoader";
import { AdminErrorBoundary } from "../../components/admin/AdminErrorBoundary";
import { fetchStats } from "../../api/adminApi";

// ── Pure-SVG bar chart ────────────────────────────────────────────────────
function BarChart({ data, color = "var(--accent)" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 500, H = 120, barW = Math.floor(W / data.length) - 4;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="analytics-svg">
      {data.map((d, i) => {
        const barH = Math.round((d.value / max) * H);
        const x = i * (W / data.length) + 2;
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx="3" opacity="0.85" />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)">
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Donut chart ───────────────────────────────────────────────────────
function DonutChart({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div className="analytics-empty">No data</div>;
  const R = 60, cx = 80, cy = 80, stroke = 28;
  let angle = -Math.PI / 2;
  const arcs = slices.map((s) => {
    const pct = s.value / total;
    const a2 = angle + pct * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(a2);
    const y2 = cy + R * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
    angle = a2;
    return { ...s, d, pct };
  });

  return (
    <div className="analytics-donut-wrap">
      <svg viewBox="0 0 160 160" className="analytics-donut-svg">
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.d} fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.9)" fontWeight="700">
          {total}
        </text>
      </svg>
      <div className="analytics-legend">
        {slices.map((s) => (
          <div key={s.label} className="analytics-legend-item">
            <span className="analytics-legend-dot" style={{ background: s.color }} />
            <span>{s.label}</span>
            <span className="analytics-legend-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await fetchStats();
      setData(d);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build donut slices from byExam
  const examColors = { nimcet: "var(--accent)", cuet: "var(--accent-2)", rrb: "var(--green)" };
  const examSlices = data
    ? Object.entries(data.byExam || {}).map(([exam, info]) => ({
        label: exam.toUpperCase(),
        value: info.total,
        color: examColors[exam] || "var(--muted)",
      }))
    : [];

  // Job success vs failure
  const jobSlices = data
    ? [
        { label: "Completed", value: data.jobs?.completed || 0, color: "var(--green)" },
        { label: "Failed",    value: data.jobs?.failed    || 0, color: "var(--red)"   },
        { label: "Waiting",   value: data.jobs?.waiting   || 0, color: "var(--amber)" },
        { label: "Active",    value: data.jobs?.active    || 0, color: "var(--accent-2)" },
      ]
    : [];

  // Simulated last-14-day upload bars (using uploadsToday for "today", others zero for demo)
  const dayBars = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const label = d.toLocaleDateString("en", { month: "numeric", day: "numeric" });
    return { label, value: i === 13 && data ? data.uploadsToday : 0 };
  });

  return (
    <AdminLayout>
      <AdminErrorBoundary>
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Analytics</h1>
              <p className="admin-page-sub">Visual breakdown of exams, results, and job health</p>
            </div>
            <button className="button" onClick={load} disabled={loading}>↻ Refresh</button>
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && !data && <AdminLoader message="Loading analytics…" />}

          {data && (
            <div className="analytics-grid">

              {/* Timeline */}
              <div className="admin-card analytics-wide">
                <h3 className="analytics-card-title">📅 Uploads — Last 14 Days</h3>
                <BarChart data={dayBars} color="var(--accent)" />
                <p className="analytics-note">Historical data requires time-series tracking. Today's count is live.</p>
              </div>

              {/* Exam distribution */}
              <div className="admin-card">
                <h3 className="analytics-card-title">🎓 Exam Distribution</h3>
                <DonutChart slices={examSlices} />
              </div>

              {/* Job health */}
              <div className="admin-card">
                <h3 className="analytics-card-title">⚙️ Job Queue Health</h3>
                <DonutChart slices={jobSlices} />
              </div>

              {/* Marks summary */}
              <div className="admin-card analytics-wide">
                <h3 className="analytics-card-title">📊 Marks Overview</h3>
                <div className="analytics-marks-grid">
                  <div className="analytics-marks-item">
                    <div className="analytics-marks-val">{data.avgMarks?.toFixed(1) ?? "—"}</div>
                    <div className="analytics-marks-label">Average Marks</div>
                  </div>
                  <div className="analytics-marks-item">
                    <div className="analytics-marks-val">{data.totalResults ?? "—"}</div>
                    <div className="analytics-marks-label">Total Submissions</div>
                  </div>
                  <div className="analytics-marks-item">
                    <div className="analytics-marks-val">{data.uploadsToday ?? "—"}</div>
                    <div className="analytics-marks-label">Today's Uploads</div>
                  </div>
                  <div className="analytics-marks-item">
                    <div className="analytics-marks-val">
                      {data.jobs
                        ? (
                            ((data.jobs.completed || 0) /
                              Math.max(1, (data.jobs.completed || 0) + (data.jobs.failed || 0))) *
                            100
                          ).toFixed(1) + "%"
                        : "—"}
                    </div>
                    <div className="analytics-marks-label">Job Success Rate</div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </AdminErrorBoundary>
    </AdminLayout>
  );
}
