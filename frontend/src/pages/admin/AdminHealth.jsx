import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminLoader } from "../../components/admin/AdminLoader";
import { AdminErrorBoundary } from "../../components/admin/AdminErrorBoundary";
import { fetchHealth } from "../../api/adminApi";

function StatusTile({ label, status, detail }) {
  const map = {
    connected: { cls: "health-green", icon: "✅", text: "Connected" },
    ok:         { cls: "health-green", icon: "✅", text: "Operational" },
    connecting: { cls: "health-yellow", icon: "⚠️", text: "Connecting…" },
    degraded:   { cls: "health-yellow", icon: "⚠️", text: "Degraded" },
    timeout:    { cls: "health-yellow", icon: "⏱️", text: "Timeout" },
    down:         { cls: "health-red",  icon: "❌", text: "Down" },
    disconnected: { cls: "health-red",  icon: "❌", text: "Disconnected" },
    unknown:      { cls: "health-red",  icon: "❓", text: "Unknown" },
  };
  const { cls, icon, text } = map[status] || map.unknown;
  return (
    <div className={`health-tile ${cls}`}>
      <div className="health-tile-icon">{icon}</div>
      <div className="health-tile-label">{label}</div>
      <div className="health-tile-status">{text}</div>
      {detail && <div className="health-tile-detail">{detail}</div>}
    </div>
  );
}

export function AdminHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await fetchHealth();
      setData(d);
      setLastChecked(new Date().toLocaleTimeString());
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Health check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <AdminLayout>
      <AdminErrorBoundary>
        <div className="admin-page">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">System Health</h1>
              <p className="admin-page-sub">
                {lastChecked ? `Last checked: ${lastChecked} · Auto-refreshes every 15s` : "Checking…"}
              </p>
            </div>
            <button className="button" onClick={load} disabled={loading}>↻ Check Now</button>
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && !data && <AdminLoader message="Checking services…" />}

          {data && (
            <>
              <div className="health-grid">
                <StatusTile label="MongoDB" status={data.mongo} />
                <StatusTile label="Redis" status={data.redis} />
                <StatusTile label="Parser Service" status={data.parser} detail={data.parserDetail?.circuit ?? null} />
              </div>

              <div className="admin-section">
                <h2 className="admin-section-title">Last Check Timestamp</h2>
                <div className="admin-card health-timestamp">
                  <span className="admin-muted">
                    {data.timestamp ? new Date(data.timestamp).toLocaleString("en-IN") : "—"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminErrorBoundary>
    </AdminLayout>
  );
}
