import { StatCard } from "../components/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function ResultPage({ result, onBack }) {
  const confidence = typeof result?.confidence === "number" ? result.confidence : null;
  const warning =
    result?.warning ||
    (confidence != null && confidence < 0.7
      ? "Parsing may be inaccurate. Please verify answers."
      : null);

  const sections = result?.sections || null;

  let chartData = [];
  if (sections) {
    chartData = [
      { name: "Math", Marks: sections.mathematics.marks },
      { name: "Logical Reasoning", Marks: sections.logicalReasoning.marks },
      { name: "Computer Awareness", Marks: sections.computerAwareness.marks },
      { name: "General English", Marks: sections.generalEnglish.marks },
    ];
  }

  const pieData = [
    { name: "Correct", value: result?.correct || 0, color: "#10b981" }, // Emerald 500
    { name: "Incorrect", value: result?.incorrect || 0, color: "#ef4444" }, // Red 500
    { name: "Unattempted", value: result?.unattempted || 0, color: "#64748b" }, // Slate 500
  ].filter(d => d.value > 0);

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <button 
        onClick={onBack} 
        className="button" 
        style={{ marginBottom: "2rem", border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        ← Back to Exam Hub
      </button>
      <section className="hero hero-row" style={{ background: "rgba(255,255,255,0.03)", padding: "1.5rem 2rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div>
          <h1 style={{ marginBottom: "8px", background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {result?.candidateDetails?.name !== "Unknown" ? result.candidateDetails.name : "Candidate"} Result
          </h1>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span className="pill" style={{ borderColor: "rgba(124, 58, 237, 0.4)", color: "#a78bfa" }}>
              Exam: {result?.exam?.toUpperCase() || "Unknown"}
            </span>
            {result?.candidateDetails?.app_no && result.candidateDetails.app_no !== "Unknown" && (
              <span className="pill">App No: {result.candidateDetails.app_no}</span>
            )}
            {result?.candidateDetails?.roll_no && result.candidateDetails.roll_no !== "Unknown" && (
              <span className="pill">Roll No: {result.candidateDetails.roll_no}</span>
            )}
          </div>
        </div>
        <div className="hero-actions">
          <button className="button" type="button" onClick={onBack}>
            Check another PDF
          </button>
        </div>
      </section>

      <section className="grid">
        <StatCard label="Total marks" value={result?.marks ?? "-"} hint={result?.exam === "cuet" ? "+4 / -1" : result?.exam === "rrb" ? "+1 / -0.33" : "Section-wise (NIMCET)"} />
        <StatCard label="Correct" value={result?.correct ?? "-"} />
        <StatCard label="Incorrect" value={result?.incorrect ?? "-"} />
        <StatCard label="Unattempted" value={result?.unattempted ?? "-"} />
      </section>

      {warning ? (
        <section className="alert">
          <strong>⚠️</strong> {warning}
          {confidence != null ? (
            <span style={{ marginLeft: 8, opacity: 0.85 }}>
              (confidence: {confidence})
            </span>
          ) : null}
        </section>
      ) : null}

      {sections && (
        <section className="card" style={{ marginTop: "2rem" }}>
          <h2 className="section-title">Section-wise Breakdown</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem" }}>Section</th>
                  <th style={{ padding: "0.75rem" }}>Correct</th>
                  <th style={{ padding: "0.75rem" }}>Incorrect</th>
                  <th style={{ padding: "0.75rem" }}>Unattempted</th>
                  <th style={{ padding: "0.75rem" }}>Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.75rem" }}>Mathematics (+12/-3)</td>
                  <td style={{ padding: "0.75rem", color: "#10b981" }}>{sections.mathematics.correct}</td>
                  <td style={{ padding: "0.75rem", color: "#ef4444" }}>{sections.mathematics.incorrect}</td>
                  <td style={{ padding: "0.75rem" }}>{sections.mathematics.unattempted}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{sections.mathematics.marks}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.75rem" }}>Logical Reasoning (+6/-1.5)</td>
                  <td style={{ padding: "0.75rem", color: "#10b981" }}>{sections.logicalReasoning.correct}</td>
                  <td style={{ padding: "0.75rem", color: "#ef4444" }}>{sections.logicalReasoning.incorrect}</td>
                  <td style={{ padding: "0.75rem" }}>{sections.logicalReasoning.unattempted}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{sections.logicalReasoning.marks}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.75rem" }}>Computer Awareness (+6/-1.5)</td>
                  <td style={{ padding: "0.75rem", color: "#10b981" }}>{sections.computerAwareness.correct}</td>
                  <td style={{ padding: "0.75rem", color: "#ef4444" }}>{sections.computerAwareness.incorrect}</td>
                  <td style={{ padding: "0.75rem" }}>{sections.computerAwareness.unattempted}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{sections.computerAwareness.marks}</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem" }}>General English (+4/-1)</td>
                  <td style={{ padding: "0.75rem", color: "#10b981" }}>{sections.generalEnglish.correct}</td>
                  <td style={{ padding: "0.75rem", color: "#ef4444" }}>{sections.generalEnglish.incorrect}</td>
                  <td style={{ padding: "0.75rem" }}>{sections.generalEnglish.unattempted}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{sections.generalEnglish.marks}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        {sections && (
          <section className="card">
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>Score Distribution</h2>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#94a3b8" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ color: "#38bdf8" }}
                  />
                  <Bar dataKey="Marks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="card">
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>Attempt Analysis</h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

