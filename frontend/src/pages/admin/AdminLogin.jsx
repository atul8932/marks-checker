import { useState } from "react";
import { fetchHealth, setAdminToken } from "../../api/adminApi";

export function AdminLogin() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Validate by hitting health endpoint with the entered secret
      await fetchHealth(secret.trim());
      setAdminToken(secret.trim());
      window.location.hash = "#/admin";
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid admin secret. Please try again.");
      } else if (err.response?.status === 429) {
        setError("Too many attempts. Please wait 15 minutes.");
      } else {
        setError("Could not connect to the server. Check your network.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">🛡️</div>
        <h1 className="admin-login-title">Admin Access</h1>
        <p className="admin-login-sub">Enter your admin secret to continue</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="field">
            <label className="label">Admin Secret</label>
            <input
              id="adminSecretInput"
              type="password"
              className="input"
              placeholder="Enter secret…"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <div className="alert">{error}</div>}

          <button
            id="adminLoginBtn"
            type="submit"
            className="button primary button-lg"
            disabled={loading || !secret.trim()}
          >
            {loading ? "Verifying…" : "Access Admin Panel"}
          </button>
        </form>

        <p className="admin-login-footer">
          Session ends when you close this tab.
        </p>
      </div>
    </div>
  );
}
