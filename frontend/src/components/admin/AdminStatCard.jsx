export function AdminStatCard({ icon, label, value, sub, accent }) {
  const style = accent ? { "--card-accent": accent } : {};
  return (
    <div className="admin-stat-card" style={style}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value ?? "—"}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  );
}
