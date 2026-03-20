import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminLoader } from "../../components/admin/AdminLoader";
import { AdminErrorBoundary } from "../../components/admin/AdminErrorBoundary";
import { DataTable } from "../../components/admin/DataTable";
import { JobStatusBadge } from "../../components/admin/JobStatusBadge";
import { fetchJobs, retryJob as apiRetryJob } from "../../api/adminApi";

const STATUS_TABS = ["all", "active", "waiting", "completed", "failed", "delayed"];

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + fmtTime(iso);
}

function RetryButton({ job, onRetried }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  if (job.state !== "failed") return null;

  async function handleRetry() {
    setLoading(true);
    setErr("");
    try {
      await apiRetryJob(job.id);
      setDone(true);
      setTimeout(onRetried, 1500);
    } catch (e) {
      setErr(e.response?.data?.error || "Retry failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <span className="admin-badge badge-green">✓ Queued</span>;
  return (
    <div>
      <button className="button admin-retry-btn" onClick={handleRetry} disabled={loading}>
        {loading ? "…" : "↩ Retry"}
      </button>
      {err && <div className="admin-retry-err">{err}</div>}
    </div>
  );
}

const COLUMNS = [
  { key: "id",       label: "Job ID",   render: (r) => <code className="admin-job-id">{String(r.id).slice(0, 8)}…</code> },
  { key: "exam",     label: "Exam",     render: (r) => r.exam ? <span className="admin-badge badge-muted">{r.exam.toUpperCase()}</span> : "—" },
  { key: "fileName", label: "File",     render: (r) => <span className="admin-filename" title={r.fileName}>{r.fileName?.slice(0, 24) || "—"}</span> },
  { key: "state",    label: "Status",   render: (r) => <JobStatusBadge status={r.state} /> },
  { key: "progress", label: "Progress", render: (r) => (
    <div className="admin-progress-wrap">
      <div className="admin-progress-bar">
        <div className="admin-progress-fill" style={{ width: `${r.progress || 0}%` }} />
      </div>
      <span>{r.progress || 0}%</span>
    </div>
  )},
  { key: "attemptsMade", label: "Attempts" },
  { key: "finishedOn",   label: "Finished", render: (r) => fmtDate(r.finishedOn) },
  { key: "retry",        label: "",          render: (r, reload) => <RetryButton job={r} onRetried={reload} /> },
];

export function AdminJobs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const d = await fetchJobs({ status, page: p, limit: 20 });
      setData(d);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Queue unavailable");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(1); }, [load]);

  const columns = COLUMNS.map((col) =>
    col.key === "retry"
      ? { ...col, render: (r) => <RetryButton job={r} onRetried={() => load(page)} /> }
      : col
  );

  return (
    <AdminLayout>
      <AdminErrorBoundary>
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Job Monitor</h1>
              <p className="admin-page-sub">
                {data ? `${data.total} jobs shown` : "Loading…"}
              </p>
            </div>
            <button className="button" onClick={() => load(page)} disabled={loading}>↻ Refresh</button>
          </div>

          {/* Status tabs */}
          <div className="admin-tabs">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                className={`admin-tab ${status === s ? "active" : ""}`}
                onClick={() => { setStatus(s); setPage(1); }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && <AdminLoader message="Loading jobs…" />}

          {!loading && data && (
            <DataTable
              columns={columns}
              rows={data.jobs}
              page={page}
              totalPages={Math.ceil(data.total / 20)}
              onPageChange={(p) => load(p)}
              emptyMessage="No jobs found."
            />
          )}
        </div>
      </AdminErrorBoundary>
    </AdminLayout>
  );
}
