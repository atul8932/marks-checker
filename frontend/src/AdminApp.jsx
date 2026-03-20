import { useState, useEffect } from "react";
import { AdminLogin }     from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminResults }   from "./pages/admin/AdminResults";
import { AdminJobs }      from "./pages/admin/AdminJobs";
import { AdminHealth }    from "./pages/admin/AdminHealth";
import { getAdminToken }  from "./api/adminApi";

/** Isolated admin SPA — handles all #/admin/* sub-routes. */
export function AdminApp() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Redirect to login if not authenticated (unless already on login)
  if (!getAdminToken() && hash !== "#/admin/login") {
    window.location.hash = "#/admin/login";
    return null;
  }

  if (hash === "#/admin/login") return <AdminLogin />;
  if (hash === "#/admin/analytics") return <AdminAnalytics />;
  if (hash === "#/admin/results")   return <AdminResults />;
  if (hash === "#/admin/jobs")      return <AdminJobs />;
  if (hash === "#/admin/health")    return <AdminHealth />;

  // Default: dashboard
  return <AdminDashboard />;
}
