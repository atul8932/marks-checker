export function LandingPage({ onGetStarted }) {
  return (
    <div className="page animate-fade" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "4rem 0 3rem" }} className="animate-slide">
        <div style={{ marginBottom: "20px" }}>
          <span className="pill" style={{ background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.3)", color: "#c4b5fd" }}>
            ✨ Free & Instant Results
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1,
          background: "linear-gradient(135deg, #fff 20%, #c4b5fd 50%, #22d3ee 80%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "20px", letterSpacing: "-1.5px",
        }}>
          Your Exam Score,<br />Analysed in Seconds
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "18px", maxWidth: "560px", margin: "0 auto 32px", lineHeight: 1.6 }}>
          Upload your response sheet PDF and get instant marks calculation, section-wise breakdown, and detailed performance analytics.
        </p>
        <button
          className="button primary button-lg"
          onClick={onGetStarted}
          style={{ fontSize: "17px", padding: "16px 40px" }}
        >
          Get Started — It's Free →
        </button>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="feature-grid animate-slide-delay-1" style={{ marginTop: "1rem" }}>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "rgba(124,58,237,0.15)" }}>📄</div>
          <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>Upload PDF</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.5 }}>
            Simply upload your response sheet PDF. We support NIMCET, CUET PG, RRB Technician and more.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "rgba(34,211,238,0.15)" }}>⚡</div>
          <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>Instant Analysis</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.5 }}>
            AI-powered parser extracts your answers and calculates your score with section-wise breakdown.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "rgba(16,185,129,0.15)" }}>📊</div>
          <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>Detailed Report</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.5 }}>
            Get accuracy rates, performance charts, downloadable PDF reports, and shareable result links.
          </p>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section className="animate-slide-delay-2" style={{
        marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px", textAlign: "center",
      }}>
        {[
          { n: "3+", label: "Exams Supported" },
          { n: "∞", label: "Free Results" },
          { n: "< 10s", label: "Analysis Time" },
          { n: "PDF", label: "Report Export" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "20px 16px" }}>
            <div style={{ fontSize: "28px", fontWeight: 900, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {s.n}
            </div>
            <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="animate-slide-delay-3" style={{ textAlign: "center", padding: "3rem 0 1rem" }}>
        <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
          Trusted by students across India. Built for accuracy.
        </p>
        <button className="button primary" onClick={onGetStarted} style={{ padding: "14px 32px" }}>
          Check Your Marks Now →
        </button>
      </section>
    </div>
  );
}
