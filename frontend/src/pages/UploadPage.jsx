import { useMemo, useState } from "react";
import { api } from "../api/client";
import { Spinner } from "../components/Spinner";

export function UploadPage({ examConfig, onResult, onBack }) {
  const exam = examConfig?.id || "nimcet";
  const reqAnswerKey = examConfig?.reqAnswerKey || false;
  
  const [file, setFile] = useState(null);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fileMeta = useMemo(() => {
    if (!file) return null;
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} • ${mb} MB`;
  }, [file]);

  const akMeta = useMemo(() => {
    if (!answerKeyFile) return null;
    const mb = (answerKeyFile.size / (1024 * 1024)).toFixed(2);
    return `${answerKeyFile.name} • ${mb} MB`;
  }, [answerKeyFile]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please upload a Response PDF file.");
      return;
    }

    if (reqAnswerKey && !answerKeyFile) {
      setError("Please upload the Official Answer Key PDF.");
      return;
    }

    const form = new FormData();
    form.append("exam", exam);
    form.append("file", file);
    if (reqAnswerKey && answerKeyFile) {
      form.append("answerKeyFile", answerKeyFile);
    }

    try {
      setBusy(true);
      const resp = await api.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onResult(resp.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <button 
        onClick={onBack} 
        disabled={busy}
        className="button" 
        style={{ marginBottom: "2rem", border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        ← Back to Exam Hub
      </button>

      <section className="hero" style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ background: "linear-gradient(135deg, #7c3aed, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {examConfig?.title || "EXAM ANALYSER"}
        </h1>
        <p className="muted" style={{ fontSize: "1.1rem", maxWidth: "600px", margin: "1rem auto 0" }}>
          Upload your {examConfig?.title || "Exam"} response sheet to compute marks and see a detailed section-wise attempt analysis.
        </p>
      </section>

      <section className="card" style={{ padding: "2rem", borderRadius: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <form className="form" onSubmit={onSubmit} style={{ gap: "24px" }}>
          <div className="field">
            <label className="label" htmlFor="file" style={{ fontWeight: 600, color: "#fff" }}>
              Upload Response Sheet
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="file"
                className="input"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy}
                style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderStyle: "dashed", borderColor: "rgba(255,255,255,0.2)" }}
              />
            </div>
            {fileMeta ? <div className="help" style={{ color: "#10b981", fontWeight: 500 }}>✓ {fileMeta}</div> : null}
          </div>

          {reqAnswerKey && (
            <div className="field" style={{ animation: "fadeIn 0.3s ease" }}>
              <label className="label" htmlFor="answerKeyFile" style={{ fontWeight: 600, color: "#fff" }}>
                Upload Official Answer Key
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="answerKeyFile"
                  className="input"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
                  disabled={busy}
                  style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderStyle: "dashed", borderColor: "rgba(255,255,255,0.2)" }}
                />
              </div>
              {akMeta ? <div className="help" style={{ color: "#10b981", fontWeight: 500 }}>✓ {akMeta}</div> : null}
            </div>
          )}

          {error ? <div className="alert" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}>{error}</div> : null}

          <div className="actions" style={{ marginTop: "1rem", justifyContent: "center" }}>
            <button className="button primary" type="submit" disabled={busy} style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: 600, borderRadius: "16px" }}>
              {busy ? "Analyzing Document..." : "Calculate Marks"}
            </button>
            {busy ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", marginTop: "12px" }}><Spinner label="Running NLP models and scoring algorithms..." /></div> : null}
          </div>
        </form>
      </section>
    </div>
  );
}

