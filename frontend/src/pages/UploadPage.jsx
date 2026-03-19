import { useMemo, useState, useCallback } from "react";
import { api } from "../api/client";
import { Spinner } from "../components/Spinner";

export function UploadPage({ examConfig, onResult, onBack }) {
  const exam = examConfig?.id || "nimcet";
  const reqAnswerKey = examConfig?.reqAnswerKey || false;

  const [file, setFile] = useState(null);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [akDragOver, setAkDragOver] = useState(false);

  const currentStep = busy ? 3 : file ? 2 : 1;

  const fileMeta = useMemo(() => {
    if (!file) return null;
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return { name: file.name, size: `${mb} MB` };
  }, [file]);

  const akMeta = useMemo(() => {
    if (!answerKeyFile) return null;
    const mb = (answerKeyFile.size / (1024 * 1024)).toFixed(2);
    return { name: answerKeyFile.name, size: `${mb} MB` };
  }, [answerKeyFile]);

  function handleDrop(e, setter, overSetter) {
    e.preventDefault();
    overSetter(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type === "application/pdf") setter(f);
    else setError("Please drop a valid PDF file.");
  }

  function handleDragOver(e, overSetter) {
    e.preventDefault();
    overSetter(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) { setError("Please upload a Response PDF file."); return; }
    if (reqAnswerKey && !answerKeyFile) { setError("Please upload the Official Answer Key PDF."); return; }

    const form = new FormData();
    form.append("exam", exam);
    form.append("file", file);
    if (reqAnswerKey && answerKeyFile) form.append("answerKeyFile", answerKeyFile);

    try {
      setBusy(true);
      setStatusText("Uploading PDF...");
      setProgress(0);
      const resp = await api.post("/api/upload", form, { headers: { "Content-Type": "multipart/form-data" } });

      // ── ASYNC mode: poll for job completion ─────────────────
      if (resp.data.mode === "async" && resp.data.jobId) {
        const jobId = resp.data.jobId;
        setStatusText("Queued — waiting for worker...");

        let pollCount = 0;
        const maxPolls = 90;

        const poll = async () => {
          if (pollCount >= maxPolls) {
            setError("Processing timed out. Please try again.");
            setBusy(false);
            return;
          }
          pollCount++;

          try {
            const jobResp = await api.get(`/api/job/${jobId}`);
            const { status, result, error: jobError, progress: pct, eta, position } = jobResp.data;

            if (status === "completed" && result) {
              setProgress(100);
              setStatusText("Done!");
              setTimeout(() => onResult(result), 300);
              return;
            }

            if (status === "failed") {
              setError(jobError || "Processing failed. Please try again.");
              setBusy(false);
              return;
            }

            // Update progress
            if (typeof pct === "number") setProgress(pct);

            // Update status text with ETA
            if (status === "queued") {
              const pos = typeof position === "number" ? position : "?";
              setStatusText(`In queue (position ${pos})${eta ? ` — ~${eta}s remaining` : ""}`);
            } else if (status === "active") {
              setStatusText(
                `Analysing your PDF... ${pct || 0}%${eta ? ` — ~${eta}s remaining` : ""}`
              );
            }

            // Adaptive polling: fast when progress > 80%, slower otherwise
            let delay;
            if (pct > 80) {
              delay = 500;   // almost done — poll fast
            } else if (pollCount < 3) {
              delay = 1500;  // first few polls
            } else {
              delay = Math.min(1000 + pollCount * 500, 4000);
            }
            setTimeout(poll, delay);
          } catch {
            setTimeout(poll, 3000);
          }
        };

        setTimeout(poll, 1500);
        return;
      }

      // ── SYNC mode: result returned immediately ─────────────
      onResult(resp.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page animate-fade" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <button onClick={onBack} disabled={busy} className="button"
        style={{ marginBottom: "1rem", border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
        ← Back to Exams
      </button>

      {/* ── Steps ──────────────────────────────────────────────── */}
      <div className="steps">
        <div className={`step ${currentStep >= 1 ? (currentStep > 1 ? "done" : "active") : ""}`}>
          <div className="step-dot">{currentStep > 1 ? "✓" : "1"}</div>
          <span className="step-label">Select File</span>
        </div>
        <div className={`step-line ${currentStep > 1 ? "done" : ""}`} />
        <div className={`step ${currentStep >= 2 ? (currentStep > 2 ? "done" : "active") : ""}`}>
          <div className="step-dot">{currentStep > 2 ? "✓" : "2"}</div>
          <span className="step-label">Confirm</span>
        </div>
        <div className={`step-line ${currentStep > 2 ? "done" : ""}`} />
        <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-dot">3</div>
          <span className="step-label">Analyse</span>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "clamp(24px, 4vw, 36px)" }}>
          {examConfig?.title || "Exam Analyser"}
        </h1>
        <p className="muted" style={{ fontSize: "14px", maxWidth: "480px", margin: "8px auto 0" }}>
          Upload your {examConfig?.title || "exam"} response sheet to get an instant, detailed analysis.
        </p>
      </section>

      {/* ── Upload Form ────────────────────────────────────────── */}
      <section className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
        <form className="form" onSubmit={onSubmit} style={{ gap: "20px" }}>
          {/* Response sheet drop zone */}
          <div className="field">
            <label className="label">Response Sheet (PDF)</label>
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
              onDrop={(e) => handleDrop(e, setFile, setDragOver)}
              onDragOver={(e) => handleDragOver(e, setDragOver)}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById("file-input").click()}
            >
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <span style={{ fontSize: "28px" }}>📄</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{fileMeta.name}</div>
                    <div style={{ color: "var(--green)", fontSize: "12px" }}>✓ {fileMeta.size}</div>
                  </div>
                  <button type="button" className="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ marginLeft: "12px", padding: "4px 10px", fontSize: "12px" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.6 }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                    Drop your PDF here or click to browse
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "12px" }}>Supports .pdf files</div>
                </>
              )}
              <input id="file-input" type="file" accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy} style={{ display: "none" }} />
            </div>
          </div>

          {/* Answer key drop zone (conditional) */}
          {reqAnswerKey && (
            <div className="field animate-slide">
              <label className="label">Official Answer Key (PDF)</label>
              <div
                className={`drop-zone ${akDragOver ? "drag-over" : ""} ${answerKeyFile ? "has-file" : ""}`}
                onDrop={(e) => handleDrop(e, setAnswerKeyFile, setAkDragOver)}
                onDragOver={(e) => handleDragOver(e, setAkDragOver)}
                onDragLeave={() => setAkDragOver(false)}
                onClick={() => document.getElementById("ak-input").click()}
                style={{ padding: "28px 24px" }}
              >
                {answerKeyFile ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>🔑</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{akMeta.name}</div>
                      <div style={{ color: "var(--green)", fontSize: "12px" }}>✓ {akMeta.size}</div>
                    </div>
                    <button type="button" className="button" onClick={(e) => { e.stopPropagation(); setAnswerKeyFile(null); }}
                      style={{ marginLeft: "12px", padding: "4px 10px", fontSize: "12px" }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.6 }}>🔑</div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Drop Answer Key PDF</div>
                  </>
                )}
                <input id="ak-input" type="file" accept="application/pdf"
                  onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
                  disabled={busy} style={{ display: "none" }} />
              </div>
            </div>
          )}

          {error && (
            <div className="alert">{error}</div>
          )}

          <button className="button primary button-lg" type="submit" disabled={busy}
            style={{ width: "100%", fontSize: "16px" }}>
            {busy ? "Analysing Document..." : "🚀 Calculate Marks"}
          </button>

          {busy && (
            <div className="animate-slide" style={{ display: "grid", gap: "12px", justifyItems: "center" }}>
              <Spinner label={statusText || "Processing..."} />
              {progress > 0 && (
                <div style={{ width: "100%", maxWidth: "320px" }}>
                  <div className="progress-bar" style={{ height: "8px" }}>
                    <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ textAlign: "center", fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                    {progress}% complete
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
