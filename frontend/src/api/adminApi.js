import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ── Session-storage token helpers ─────────────────────────────────────────
// The admin secret is NEVER stored in the build or env.
// It is entered at runtime by the admin and kept only in sessionStorage.
const TOKEN_KEY = "adminToken";

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}
export function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── Axios instance ────────────────────────────────────────────────────────
export const adminApi = axios.create({
  baseURL,
  timeout: 15_000,
});

// Inject token on every request
adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// On 401 → clear token and redirect to login
adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAdminToken();
      window.location.hash = "#/admin/login";
    }
    return Promise.reject(err);
  }
);

// ── Typed API helpers ─────────────────────────────────────────────────────
export const fetchStats = () =>
  adminApi.get("/api/admin/stats").then((r) => r.data.data);

export const fetchResults = (params = {}) =>
  adminApi.get("/api/admin/results", { params }).then((r) => r.data.data);

export const fetchJobs = (params = {}) =>
  adminApi.get("/api/admin/jobs", { params }).then((r) => r.data.data);

export const fetchHealth = (token) =>
  adminApi
    .get("/api/admin/health", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    .then((r) => r.data.data);

export const retryJob = (id) =>
  adminApi.post(`/api/admin/job/${id}/retry`).then((r) => r.data);
