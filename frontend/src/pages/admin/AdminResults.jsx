import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminLoader } from "../../components/admin/AdminLoader";
import { AdminErrorBoundary } from "../../components/admin/AdminErrorBoundary";
import { DataTable } from "../../components/admin/DataTable";
import { fetchResults } from "../../api/adminApi";

const EXAMS = ["all", "nimcet", "cuet", "rrb"];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const COLUMNS = [
  { key: "name",        label: "Name" },
  { key: "exam",        label: "Exam",        render: (r) => <span className="admin-badge badge-muted">{r.exam?.toUpperCase()}</span> },
  { key: "marks",       label: "Marks",       render: (r) => <strong>{r.marks ?? "—"}</strong> },
  { key: "correct",     label: "✅ Correct"   },
  { key: "incorrect",   label: "❌ Wrong"     },
  { key: "unattempted", label: "⬜ Skip"      },
  { key: "createdAt",   label: "Date",        render: (r) => fmtDate(r.createdAt) },
];

export function AdminResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exam, setExam] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const d = await fetchResults({ exam, page: p, limit: 20 });
      setData(d);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [exam]);

  useEffect(() => { load(1); }, [load]);

  const filtered = (data?.results || []).filter((r) =>
    search ? r.name?.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <AdminLayout>
      <AdminErrorBoundary>
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Results</h1>
              <p className="admin-page-sub">
                {data ? `${data.total} total results` : "Loading…"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <input
              className="input admin-search"
              type="text"
              placeholder="🔍 Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="input admin-select"
              value={exam}
              onChange={(e) => { setExam(e.target.value); setSearch(""); }}
            >
              {EXAMS.map((ex) => (
                <option key={ex} value={ex}>{ex === "all" ? "All Exams" : ex.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && <AdminLoader message="Loading results…" />}

          {!loading && data && (
            <DataTable
              columns={COLUMNS}
              rows={filtered}
              page={page}
              totalPages={data.totalPages}
              onPageChange={(p) => load(p)}
              emptyMessage="No results found."
            />
          )}
        </div>
      </AdminErrorBoundary>
    </AdminLayout>
  );
}
