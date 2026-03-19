const mongoose = require("mongoose");
const { getResultModel } = require("../models/Result");

/**
 * GET /api/result/:id
 */
async function getResult(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid result ID.");
    err.statusCode = 400;
    throw err;
  }

  const exams = ["nimcet", "cuet", "rrb"];
  let doc = null;

  for (const exam of exams) {
    const Model = getResultModel(exam);
    doc = await Model.findById(id);
    if (doc) break;
  }

  if (!doc) {
    const err = new Error("Result not found.");
    err.statusCode = 404;
    throw err;
  }

  res.json({
    success: true,
    resultId: String(doc._id),
    exam: doc.exam,
    marks: doc.marks,
    correct: doc.correct,
    incorrect: doc.incorrect,
    unattempted: doc.unattempted,
    responses: doc.responses,
    candidateDetails: {
      name: doc.name,
      app_no: doc.applicationNo,
      roll_no: doc.rollNo,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

/* ════════════════════════════════════════════════════════════════
 *  PREMIUM PDF REPORT GENERATOR
 * ════════════════════════════════════════════════════════════════ */

// Color palette
const C = {
  primary: "#7c3aed",
  secondary: "#22d3ee",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  darkBg: "#0f172a",
  cardBg: "#1e293b",
  border: "#334155",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
  white: "#ffffff",
};

function drawRoundedRect(pdf, x, y, w, h, r, fill) {
  pdf.save();
  pdf.roundedRect(x, y, w, h, r).fill(fill);
  pdf.restore();
}

function drawProgressBar(pdf, x, y, w, h, pct, color) {
  // Background
  drawRoundedRect(pdf, x, y, w, h, h / 2, "#1e293b");
  // Fill
  const fillW = Math.max(h, w * Math.min(1, pct / 100));
  drawRoundedRect(pdf, x, y, fillW, h, h / 2, color);
}

/**
 * GET /api/report/:id
 */
async function downloadReport(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid result ID.");
    err.statusCode = 400;
    throw err;
  }

  const exams = ["nimcet", "cuet", "rrb"];
  let doc = null;

  for (const exam of exams) {
    const Model = getResultModel(exam);
    doc = await Model.findById(id);
    if (doc) break;
  }

  if (!doc) {
    const err = new Error("Result not found.");
    err.statusCode = 404;
    throw err;
  }

  const PDFDocument = require("pdfkit");
  const pdf = new PDFDocument({ margin: 0, size: "A4" });

  const filename = `exam-report-${id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  pdf.pipe(res);

  const W = 595.28; // A4 width
  const M = 40; // margin
  const CW = W - M * 2; // content width

  // ── Page Background ─────────────────────────────────────────
  pdf.rect(0, 0, W, 842).fill(C.darkBg);

  // ── Header Bar ──────────────────────────────────────────────
  const grad = pdf.linearGradient(0, 0, W, 0);
  grad.stop(0, C.primary).stop(1, C.secondary);
  pdf.rect(0, 0, W, 80).fill(grad);

  pdf.fontSize(22).fillColor(C.white).font("Helvetica-Bold")
    .text("EXAM ANALYSER", M, 22);
  pdf.fontSize(10).fillColor("rgba(255,255,255,0.7)").font("Helvetica")
    .text("Marks & Response Report", M, 48);

  pdf.fontSize(10).fillColor("rgba(255,255,255,0.7)").font("Helvetica")
    .text(doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—", W - M - 150, 30, { width: 150, align: "right" });

  // ── Candidate Info Card ─────────────────────────────────────
  const cardY = 100;
  drawRoundedRect(pdf, M, cardY, CW, 80, 8, C.cardBg);

  const infoEntries = [
    ["Name", doc.name !== "Unknown" ? doc.name : "—"],
    ["Exam", doc.exam.toUpperCase()],
    ["App No.", doc.applicationNo !== "Unknown" ? doc.applicationNo : "—"],
    ["Roll No.", doc.rollNo !== "Unknown" ? doc.rollNo : "—"],
  ];

  const colW = CW / 4;
  infoEntries.forEach(([label, value], i) => {
    const cx = M + colW * i + 16;
    pdf.fontSize(9).fillColor(C.textMuted).font("Helvetica").text(label, cx, cardY + 18);
    pdf.fontSize(13).fillColor(C.textPrimary).font("Helvetica-Bold").text(value, cx, cardY + 34, { width: colW - 32 });
  });

  // ── Score Summary Cards ─────────────────────────────────────
  const scoreY = 200;
  pdf.fontSize(14).fillColor(C.textPrimary).font("Helvetica-Bold")
    .text("Score Summary", M, scoreY);

  const scoreCardY = scoreY + 26;
  const scoreCards = [
    { label: "Total Marks", value: typeof doc.marks === "number" ? doc.marks.toFixed(1) : "—", color: C.primary },
    { label: "Correct", value: String(doc.correct), color: C.green },
    { label: "Incorrect", value: String(doc.incorrect), color: C.red },
    { label: "Unattempted", value: String(doc.unattempted), color: C.textMuted },
  ];

  const scW = (CW - 18) / 4;
  scoreCards.forEach((sc, i) => {
    const sx = M + (scW + 6) * i;
    drawRoundedRect(pdf, sx, scoreCardY, scW, 65, 6, C.cardBg);
    // Top accent line
    pdf.rect(sx, scoreCardY, scW, 3).fill(sc.color);
    pdf.fontSize(9).fillColor(C.textMuted).font("Helvetica").text(sc.label, sx + 10, scoreCardY + 14);
    pdf.fontSize(22).fillColor(C.textPrimary).font("Helvetica-Bold").text(sc.value, sx + 10, scoreCardY + 30);
  });

  // ── Performance Insights ────────────────────────────────────
  const totalQ = doc.correct + doc.incorrect + doc.unattempted;
  const attempted = doc.correct + doc.incorrect;
  const accuracy = attempted > 0 ? (doc.correct / attempted * 100) : 0;
  const attemptRate = totalQ > 0 ? (attempted / totalQ * 100) : 0;

  const insightY = scoreCardY + 85;
  pdf.fontSize(14).fillColor(C.textPrimary).font("Helvetica-Bold")
    .text("Performance Insights", M, insightY);

  const insY = insightY + 26;
  drawRoundedRect(pdf, M, insY, CW, 90, 6, C.cardBg);

  // ===== Accuracy =====
pdf.fontSize(10)
  .fillColor(C.textMuted)
  .font("Helvetica")
  .text("Accuracy", M + 16, insY + 12);

pdf.fontSize(12)
  .fillColor(C.textPrimary)
  .font("Helvetica-Bold")
  .text(`${accuracy.toFixed(1)}%`, M + CW - 70, insY + 10, {
    width: 60,
    align: "right"
  });

drawProgressBar(
  pdf,
  M + 16,
  insY + 28,
  CW - 32,
  6,
  accuracy,
  accuracy >= 70 ? C.green : accuracy >= 40 ? C.amber : C.red
);


// ===== Attempt Rate =====
pdf.fontSize(10)
  .fillColor(C.textMuted)
  .font("Helvetica")
  .text("Attempt Rate", M + 16, insY + 50);

pdf.fontSize(12)
  .fillColor(C.textPrimary)
  .font("Helvetica-Bold")
  .text(`${attemptRate.toFixed(1)}%`, M + CW - 70, insY + 48, {
    width: 60,
    align: "right"
  });

drawProgressBar(
  pdf,
  M + 16,
  insY + 66,
  CW - 32,
  6,
  attemptRate,
  C.secondary
);

  // ── Response Grid ───────────────────────────────────────────
  const responses = doc.responses || {};
  const keys = Object.keys(responses).sort((a, b) => parseInt(a.replace("Q", "")) - parseInt(b.replace("Q", "")));

  if (keys.length > 0) {
    const gridY = insY + 80;
    pdf.fontSize(14).fillColor(C.textPrimary).font("Helvetica-Bold")
      .text("Your Responses", M, gridY);

    const cols = 10;
    const cellW = CW / cols;
    const cellH = 28;
    let gy = gridY + 24;

    keys.forEach((q, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = M + col * cellW;
      const cy = gy + row * cellH;

      if (cy > 750) return; // prevent overflow

      const rawVal = responses[q];
      const val = ["A", "B", "C", "D"].includes(rawVal) ? rawVal : null;
      const bg = val ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)";
      drawRoundedRect(pdf, cx + 1, cy, cellW - 2, cellH - 3, 4, val ? "#1a3a4a" : "#152033");

      pdf.fontSize(7).fillColor(C.textMuted).font("Helvetica")
        .text(q, cx + 4, cy + 3, { width: cellW - 8 });
      pdf.fontSize(12).fillColor(val ? "#38bdf8" : "#475569").font("Helvetica-Bold")
        .text(val || "—", cx + 4, cy + 12, { width: cellW - 8 });
    });
  }

  // ── Footer ──────────────────────────────────────────────────
  pdf.fontSize(8).fillColor(C.textMuted).font("Helvetica")
    .text("Generated by Exam Analyser ·", M, 810, { width: CW, align: "center" });

  pdf.end();
}

module.exports = { getResult, downloadReport };
