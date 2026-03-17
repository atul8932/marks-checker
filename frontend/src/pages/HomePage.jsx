import { useState } from "react";

const EXAMS = [
  { id: "nimcet", title: "NIMCET", desc: "NIT MCA Common Entrance Test", tag: "MCA", active: true, reqAnswerKey: false },
  { id: "cuet", title: "CUET (PG)", desc: "Common University Entrance Test", tag: "PG", active: true, reqAnswerKey: true },
  { id: "jee-main", title: "JEE Main", desc: "Joint Entrance Exam (Main)", tag: "Engineering", active: false, reqAnswerKey: true },
  { id: "jee-adv", title: "JEE Advanced", desc: "Joint Entrance Exam (Advanced)", tag: "Engineering", active: false, reqAnswerKey: true },
  { id: "neet", title: "NEET UG", desc: "National Eligibility cum Entrance Test", tag: "Medical", active: false, reqAnswerKey: true },
  { id: "cat", title: "CAT", desc: "Common Admission Test", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "gate", title: "GATE", desc: "Graduate Aptitude Test in Engineering", tag: "PG Engineering", active: false, reqAnswerKey: true },
  { id: "clat", title: "CLAT", desc: "Common Law Admission Test", tag: "Law", active: false, reqAnswerKey: true },
  { id: "nda", title: "NDA", desc: "National Defence Academy Exam", tag: "Defence", active: false, reqAnswerKey: false },
  { id: "bitsat", title: "BITSAT", desc: "BITS Admission Test", tag: "Engineering", active: false, reqAnswerKey: false },
  { id: "mat", title: "MAT", desc: "Management Aptitude Test", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "xat", title: "XAT", desc: "Xavier Aptitude Test", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "snap", title: "SNAP", desc: "Symbiosis National Aptitude Test", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "mht-cet", title: "MHT CET", desc: "Maharashtra Common Entrance Test", tag: "State Level", active: false, reqAnswerKey: true },
  { id: "kcet", title: "KCET", desc: "Karnataka Common Entrance Test", tag: "State Level", active: false, reqAnswerKey: true },
  { id: "wbjee", title: "WBJEE", desc: "West Bengal Joint Entrance Exam", tag: "State Level", active: false, reqAnswerKey: true },
  { id: "viteee", title: "VITEEE", desc: "VIT Engineering Entrance Exam", tag: "Engineering", active: false, reqAnswerKey: false },
  { id: "srmjeee", title: "SRMJEEE", desc: "SRM Joint Engineering Entrance", tag: "Engineering", active: false, reqAnswerKey: false },
  { id: "nift", title: "NIFT", desc: "National Institute of Fashion Tech", tag: "Design", active: false, reqAnswerKey: true },
  { id: "nid", title: "NID DAT", desc: "National Institute of Design", tag: "Design", active: false, reqAnswerKey: true },
  { id: "ceed", title: "CEED", desc: "Common Entrance Exam for Design", tag: "PG Design", active: false, reqAnswerKey: true },
  { id: "uceed", title: "UCEED", desc: "Undergraduate CEED", tag: "Design", active: false, reqAnswerKey: true },
  { id: "lsat", title: "LSAT India", desc: "Law School Admission Test", tag: "Law", active: false, reqAnswerKey: true },
  { id: "ailet", title: "AILET", desc: "All India Law Entrance Test", tag: "Law", active: false, reqAnswerKey: true },
  { id: "cmat", title: "CMAT", desc: "Common Management Admission Test", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "atma", title: "ATMA", desc: "AIMS Test for Management Admissions", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "icai", title: "ICAI CA", desc: "Chartered Accountant Exams", tag: "Commerce", active: false, reqAnswerKey: false },
  { id: "icsi", title: "ICSI CS", desc: "Company Secretary Exams", tag: "Commerce", active: false, reqAnswerKey: false },
  { id: "ssc-cgl", title: "SSC CGL", desc: "Staff Selection Commission", tag: "Govt Job", active: false, reqAnswerKey: true },
  { id: "ssc-chsl", title: "SSC CHSL", desc: "Higher Secondary Level", tag: "Govt Job", active: false, reqAnswerKey: true },
  { id: "upsc-cse", title: "UPSC CSE", desc: "Civil Services Exam (Prelims)", tag: "Govt Job", active: false, reqAnswerKey: true },
  { id: "rrb-ntpc", title: "RRB NTPC", desc: "Railway Recruitment Board", tag: "Govt Job", active: false, reqAnswerKey: true },
  { id: "ibps-po", title: "IBPS PO", desc: "Probationary Officers Exam", tag: "Banking", active: false, reqAnswerKey: false },
  { id: "sbi-po", title: "SBI PO", desc: "State Bank of India PO", tag: "Banking", active: false, reqAnswerKey: false },
  { id: "rbi-grade-b", title: "RBI Grade B", desc: "Reserve Bank Officers Exam", tag: "Banking", active: false, reqAnswerKey: false },
  { id: "ugc-net", title: "UGC NET", desc: "National Eligibility Test", tag: "PG Teaching", active: false, reqAnswerKey: true },
  { id: "csir-net", title: "CSIR NET", desc: "Science Eligibility Test", tag: "PG Science", active: false, reqAnswerKey: true },
  { id: "tissnet", title: "TISSNET", desc: "Tata Institute of Social Sciences", tag: "PG Arts", active: false, reqAnswerKey: true },
  { id: "iift", title: "IIFT", desc: "Indian Institute of Foreign Trade", tag: "MBA", active: false, reqAnswerKey: true },
  { id: "ipmat", title: "IPMAT", desc: "IIM Integrated Program", tag: "MBA", active: false, reqAnswerKey: true }
];

export function HomePage({ onSelectExam }) {
  const [search, setSearch] = useState("");

  const filtered = EXAMS.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.desc.toLowerCase().includes(search.toLowerCase()) ||
      e.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <section className="hero" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ background: "linear-gradient(135deg, #7c3aed, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "3rem", marginBottom: "0.5rem" }}>
          EXAM ANALYSER HUB
        </h1>
        <p className="muted" style={{ fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Find your exam, upload your response sheet, and get an instant, detailed analysis of your performance.
        </p>
      </section>

      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
        <input
          type="text"
          placeholder="Search by exam name (e.g. NIMCET, CUET)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: "500px", padding: "14px 20px", fontSize: "16px", borderRadius: "99px", background: "rgba(0,0,0,0.4)" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {filtered.map((exam) => (
          <div
            key={exam.id}
            onClick={() => exam.active && onSelectExam(exam)}
            className="exam-card"
            style={{
              padding: "20px",
              borderRadius: "16px",
              background: exam.active ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))" : "rgba(255,255,255,0.02)",
              border: exam.active ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.05)",
              cursor: exam.active ? "pointer" : "not-allowed",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <span className="pill" style={{ background: "rgba(124, 58, 237, 0.2)", borderColor: "rgba(124, 58, 237, 0.4)", color: "#c4b5fd" }}>
                {exam.tag}
              </span>
              {!exam.active && (
                <span className="pill" style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.1)", fontSize: "10px" }}>
                  Coming Soon
                </span>
              )}
              {exam.active && (
                <span className="pill" style={{ background: "rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 0.4)", color: "#6ee7b7", fontSize: "10px" }}>
                  Active Layout
                </span>
              )}
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", color: exam.active ? "#fff" : "rgba(255,255,255,0.5)" }}>
              {exam.title}
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.4 }}>
              {exam.desc}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            No exams match your search.
          </div>
        )}
      </div>
    </div>
  );
}
