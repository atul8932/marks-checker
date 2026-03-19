import { useState, useRef } from "react";
import { api } from "../api/client";
import { StatCard } from "../components/StatCard";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { ProgressBar } from "../components/ProgressBar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const OPTIONS = ["A", "B", "C", "D", "Unattempted"];

export function ResultPage({ result: initialResult, onBack }) {
  const [result, setResult] = useState(initialResult);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponses, setEditedResponses] = useState(null);
  const originalResponsesRef = useRef(null);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcError, setRecalcError] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  const resultId = result?.resultId;
  const confidence = typeof result?.confidence === "number" ? result.confidence : null;
  const warning = result?.warning || (confidence != null && confidence < 0.7 ? "Parsing may be inaccurate. Please verify answers." : null);
  const sections = result?.sections || null;

  // Derived stats
  const totalQ = (result?.correct || 0) + (result?.incorrect || 0) + (result?.unattempted || 0);
  const accuracy = totalQ > 0 ? ((result?.correct || 0) / (totalQ - (result?.unattempted || 0)) * 100) : 0;
  const attemptRate = totalQ > 0 ? (((result?.correct || 0) + (result?.incorrect || 0)) / totalQ * 100) : 0;

  // Chart data
  let chartData = [];
  if (sections) {
    chartData = [
      { name: "Math", Marks: sections.mathematics?.marks ?? 0, Max: 120 },
      { name: "Logical", Marks: sections.logicalReasoning?.marks ?? 0, Max: 30 },
      { name: "CS", Marks: sections.computerAwareness?.marks ?? 0, Max: 30 },
      { name: "English", Marks: sections.generalEnglish?.marks ?? 0, Max: 20 },
    ];
  }

  const pieData = [
    { name: "Correct", value: result?.correct || 0, color: "#10b981" },
    { name: "Incorrect", value: result?.incorrect || 0, color: "#ef4444" },
    { name: "Unattempted", value: result?.unattempted || 0, color: "#334155" },
  ].filter(d => d.value > 0);

  // ── Edit helpers ──────────────────────────────────────────────
  function startEditing() {
    const cur = { ...(result?.responses || {}) };
    originalResponsesRef.current = { ...cur };
    setEditedResponses(cur);
    setIsEditing(true);
    setRecalcError("");
  }
  function cancelEditing() {
    setIsEditing(false);
    setEditedResponses(null);
    originalResponsesRef.current = null;
    setRecalcError("");
  }
  function setResponse(q, val) {
    setEditedResponses(prev => ({ ...prev, [q]: val === "Unattempted" ? null : val }));
  }

  // ── Recalculate ──────────────────────────────────────────────
  async function recalculate() {
    if (!resultId) { setRecalcError("Result ID not found."); return; }
    setRecalcLoading(true);
    setRecalcError("");
    const cleaned = Object.fromEntries(Object.entries(editedResponses).filter(([, v]) => v != null));
    try {
      const resp = await api.post(`/api/recalculate/${resultId}`, { responses: cleaned });
      setResult(prev => ({
        ...prev, marks: resp.data.marks, correct: resp.data.correct,
        incorrect: resp.data.incorrect, unattempted: resp.data.unattempted,
        sections: resp.data.sections ?? prev.sections, responses: editedResponses,
      }));
      setIsEditing(false);
      setEditedResponses(null);
      originalResponsesRef.current = null;
    } catch (err) {
      setRecalcError(err?.response?.data?.message || err?.message || "Recalculation failed.");
    } finally { setRecalcLoading(false); }
  }

  // ── Share ────────────────────────────────────────────────────
  function copyLink() {
    const url = `${window.location.origin}/?resultId=${resultId}`;
    navigator.clipboard.writeText(url).then(() => { setCopyDone(true); setTimeout(() => setCopyDone(false), 2500); });
  }
  function shareWhatsApp() {
    const url = `${window.location.origin}/?resultId=${resultId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check my ${result?.exam?.toUpperCase()||"exam"} results: ${url}`)}`, "_blank");
  }
  function downloadReport() {
    if (!resultId) return;
    const a = document.createElement("a");
    a.href = `${API_BASE}/api/report/${resultId}`;
    a.download = `marks-report-${resultId}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const questionKeys = editedResponses
    ? Object.keys(result?.responses || {}).sort((a, b) => parseInt(a.replace("Q", "")) - parseInt(b.replace("Q", "")))
    : [];

  return (
    <div className="page animate-fade" style={{ maxWidth: "1200px" }}>
      {/* ── Back ───────────────────────────────────────────── */}
      <button onClick={onBack} className="button"
        style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", justifySelf: "start" }}>
        ← Back to Exams
      </button>

      {/* ── Header card ────────────────────────────────────── */}
      <section className="card-glass animate-slide" style={{ padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{
            marginBottom: "8px", fontSize: "clamp(22px, 3vw, 32px)",
            background: "linear-gradient(135deg, #10b981, #3b82f6, #c4b5fd)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900
          }}>
            {result?.candidateDetails?.name !== "Unknown" ? result.candidateDetails.name : "Your"} Result
          </h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {result?.exam && <span className="pill" style={{ background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.3)", color: "#c4b5fd" }}>{result.exam.toUpperCase()}</span>}
            {result?.candidateDetails?.app_no && result.candidateDetails.app_no !== "Unknown" && <span className="pill">App: {result.candidateDetails.app_no}</span>}
            {result?.candidateDetails?.roll_no && result.candidateDetails.roll_no !== "Unknown" && <span className="pill">Roll: {result.candidateDetails.roll_no}</span>}
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="button" onClick={onBack}>📋 New Analysis</button>
          {resultId && (
            <>
              <button className="button" onClick={downloadReport} style={{ background: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)", color: "#93c5fd" }}>⬇ PDF Report</button>
              <button className="button" onClick={copyLink} style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)", color: "#6ee7b7" }}>{copyDone ? "✓ Copied!" : "🔗 Share"}</button>
              <button className="button" onClick={shareWhatsApp} style={{ background: "rgba(37,211,102,0.1)", borderColor: "rgba(37,211,102,0.3)", color: "#4ade80" }}>WhatsApp</button>
            </>
          )}
        </div>
      </section>

      {/* ── Warning ────────────────────────────────────────── */}
      {warning && (
        <div className="alert alert-warning animate-slide-delay-1">
          ⚠️ {warning}
        </div>
      )}

      {/* ── Score Cards ────────────────────────────────────── */}
      <section className="grid animate-slide-delay-1">
        <StatCard label="Total Marks" value={typeof result?.marks === "number" ? result.marks.toFixed(1) : "-"} hint={result?.exam === "cuet" ? "+4 / -1" : result?.exam === "rrb" ? "+1 / -0.33" : "NIMCET Scheme"} />
        <StatCard label="Correct" value={result?.correct ?? "-"} />
        <StatCard label="Incorrect" value={result?.incorrect ?? "-"} />
        <StatCard label="Unattempted" value={result?.unattempted ?? "-"} />
      </section>

      {/* ── Insights Row ───────────────────────────────────── */}
      <section className="animate-slide-delay-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>Accuracy Rate</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: accuracy >= 70 ? "var(--green)" : accuracy >= 40 ? "var(--amber)" : "var(--red)" }}>
              {isFinite(accuracy) ? accuracy.toFixed(1) : 0}%
            </span>
          </div>
          <ProgressBar value={isFinite(accuracy) ? accuracy : 0} variant={accuracy >= 70 ? "progress-bar-green" : accuracy >= 40 ? "progress-bar-amber" : "progress-bar-red"} />
        </div>
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>Attempt Rate</span>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>{attemptRate.toFixed(1)}%</span>
          </div>
          <ProgressBar value={attemptRate} />
        </div>
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>Total Questions</span>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>{totalQ}</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            {result?.correct || 0} correct · {result?.incorrect || 0} wrong · {result?.unattempted || 0} skipped
          </div>
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {sections && (
          <section className="card animate-slide-delay-2">
            <h2 className="section-title">Section-wise Scores</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontSize: "13px" }} />
                  <Bar dataKey="Marks" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="card animate-slide-delay-3">
          <h2 className="section-title">Attempt Distribution</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "rgba(255,255,255,0.2)" }}>
                  {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ── Section Table (NIMCET) ──────────────────────────── */}
      {sections && (
        <section className="card">
          <h2 className="section-title">Section-wise Breakdown</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Section", "Correct", "Incorrect", "Unattempted", "Marks"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", color: "var(--muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Mathematics", "mathematics", "+12/−3"],
                  ["Logical Reasoning", "logicalReasoning", "+6/−1.5"],
                  ["Computer Awareness", "computerAwareness", "+6/−1.5"],
                  ["General English", "generalEnglish", "+4/−1"],
                ].map(([label, key, scheme]) => (
                  <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{label}</div>
                      <div style={{ color: "var(--muted)", fontSize: "11px" }}>{scheme}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--green)", fontWeight: 600 }}>{sections[key]?.correct}</td>
                    <td style={{ padding: "12px 14px", color: "var(--red)", fontWeight: 600 }}>{sections[key]?.incorrect}</td>
                    <td style={{ padding: "12px 14px" }}>{sections[key]?.unattempted}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 800, fontSize: "16px" }}>{sections[key]?.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Answer Correction ──────────────────────────────── */}
      {result?.responses && Object.keys(result.responses).length > 0 && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              {isEditing ? "✏️ Editing Answers" : "Your Responses"}
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              {!isEditing && (
                <button className="button" onClick={startEditing} style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.3)", color: "#c4b5fd" }}>
                  ✏️ Edit Answers
                </button>
              )}
              {isEditing && (
                <>
                  <button className="button" onClick={cancelEditing} disabled={recalcLoading}>Cancel</button>
                  <button className="button primary" onClick={recalculate} disabled={recalcLoading}>
                    {recalcLoading ? "Recalculating..." : "✓ Recalculate"}
                  </button>
                </>
              )}
            </div>
          </div>

          {recalcError && <div className="alert" style={{ marginBottom: "14px" }}>{recalcError}</div>}

          {isEditing ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
              {questionKeys.map(q => {
                const orig = originalResponsesRef.current?.[q] ?? null;
                const edited = editedResponses[q] ?? null;
                const changed = orig !== edited;
                return (
                  <div key={q} style={{
                    background: changed ? "rgba(250,204,21,0.06)" : "rgba(255,255,255,0.03)",
                    borderRadius: "var(--radius-sm)", padding: "10px",
                    border: changed ? "1px solid rgba(250,204,21,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>{q}</span>
                      {changed && <span style={{ fontSize: "9px", color: "#facc15", fontWeight: 700, textTransform: "uppercase" }}>edited</span>}
                    </div>
                    <select value={edited == null ? "Unattempted" : edited}
                      onChange={e => setResponse(q, e.target.value)} disabled={recalcLoading}
                      style={{ width: "100%", background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 6px", fontSize: "13px", cursor: recalcLoading ? "not-allowed" : "pointer", opacity: recalcLoading ? 0.5 : 1 }}>
                      {OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "6px" }}>
              {Object.entries(result.responses)
                .sort(([a], [b]) => parseInt(a.replace("Q", "")) - parseInt(b.replace("Q", "")))
                .map(([q, ans]) => (
                  <div key={q} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: "8px",
                    padding: "8px 10px", border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{q}</span>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: ans ? "#38bdf8" : "#475569" }}>{ans || "–"}</span>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
