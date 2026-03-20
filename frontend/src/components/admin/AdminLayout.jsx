import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { clearAdminToken, getAdminToken } from "../../api/adminApi";

export function AdminLayout({ children }) {
  const [hash, setHash] = useState(window.location.hash || "#/admin");

  // Redirect to login if no token
  useEffect(() => {
    if (!getAdminToken()) {
      window.location.hash = "#/admin/login";
    }
  }, []);

  // Sync hash on navigation
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(h) {
    window.location.hash = h;
    setHash(h);
  }

  function handleLogout() {
    clearAdminToken();
    window.location.hash = "#/admin/login";
  }

  return (
    <div className="admin-shell">
      <Sidebar currentHash={hash} onNavigate={navigate} onLogout={handleLogout} />
      <main className="admin-content">{children}</main>
    </div>
  );
}
