const NAV_ITEMS = [
  { hash: "#/admin",           icon: "⬛", label: "Dashboard"  },
  { hash: "#/admin/analytics", icon: "📊", label: "Analytics"  },
  { hash: "#/admin/results",   icon: "📋", label: "Results"    },
  { hash: "#/admin/jobs",      icon: "⚙️",  label: "Jobs"       },
  { hash: "#/admin/health",    icon: "💚", label: "Health"     },
];

export function Sidebar({ currentHash, onNavigate, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-logo">🛡️</span>
        <div>
          <div className="admin-sidebar-title">Admin Panel</div>
          <div className="admin-sidebar-sub">Exam Analyser</div>
        </div>
      </div>

      <nav className="admin-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = currentHash === item.hash ||
            (item.hash === "#/admin" && (currentHash === "#/admin" || currentHash === ""));
          return (
            <a
              key={item.hash}
              href={item.hash}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.hash);
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <button className="admin-logout-btn" onClick={onLogout}>
        🚪 Logout
      </button>
    </aside>
  );
}
