const mongoose = require("mongoose");
const { getResultModel } = require("../models/Result");
const { calculateNimcetScore } = require("../services/pipelines/nimcetPipeline");
const { calculateRrbScore } = require("../services/pipelines/rrbPipeline");
const { calculateCuetScore } = require("../services/pipelines/cuetPipeline");
const { logger } = require("../utils/logger");

const VALID_OPTIONS = new Set(["A", "B", "C", "D"]);
const Q_KEY_REGEX = /^Q\d+$/;

/**
 * Validate user-submitted responses object.
 * Throws on invalid input.
 */
function validateResponses(responses) {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    const err = new Error("responses object is required in request body.");
    err.statusCode = 400;
    throw err;
  }

  const keys = Object.keys(responses);
  if (keys.length === 0) {
    const err = new Error("responses object must not be empty.");
    err.statusCode = 400;
    throw err;
  }

  for (const key of keys) {
    if (!Q_KEY_REGEX.test(key)) {
      const err = new Error(`Invalid question key: "${key}". Keys must follow format Q<number> (e.g. Q1, Q42).`);
      err.statusCode = 400;
      throw err;
    }

    const val = responses[key];
    // null / undefined / "Unattempted" are all treated as unattempted
    if (val == null || val === "Unattempted") continue;

    if (!VALID_OPTIONS.has(val)) {
      const err = new Error(`Invalid answer for ${key}: "${val}". Allowed values: A, B, C, D, Unattempted.`);
      err.statusCode = 400;
      throw err;
    }
  }
}

/**
 * POST /api/recalculate/:id
 * Body: { responses: { Q1: "A", Q2: "B", ... } }
 *
 * Replaces the ENTIRE responses object (no merge).
 */
async function recalculate(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid result ID.");
    err.statusCode = 400;
    throw err;
  }

  const { responses: userResponses } = req.body || {};

  // ── Validate ────────────────────────────────────────────────────────
  validateResponses(userResponses);

  // Normalise: strip null / "Unattempted" so scoring treats them as unattempted
  const cleanedResponses = {};
  for (const [key, val] of Object.entries(userResponses)) {
    if (val != null && val !== "Unattempted") {
      cleanedResponses[key] = val;
    }
    // else: omit key → scoring functions treat missing keys as unattempted
  }

  // ── Find result across all exam collections ─────────────────────────
  const exams = ["nimcet", "cuet", "rrb"];
  let doc = null;
  let foundExam = null;

  for (const exam of exams) {
    const Model = getResultModel(exam);
    doc = await Model.findById(id);
    if (doc) { foundExam = exam; break; }
  }

  if (!doc) {
    const err = new Error("Result not found.");
    err.statusCode = 404;
    throw err;
  }

  // ── Rescore ─────────────────────────────────────────────────────────
  const answerKey = doc.answerKey || {};
  let result;

  if (foundExam === "nimcet") {
    result = calculateNimcetScore(cleanedResponses, answerKey);
  } else if (foundExam === "rrb") {
    result = calculateRrbScore(cleanedResponses, answerKey);
  } else if (foundExam === "cuet") {
    result = calculateCuetScore(cleanedResponses, answerKey);
  } else {
    const err = new Error(`Rescoring not supported for exam: ${foundExam}`);
    err.statusCode = 400;
    throw err;
  }

  // ── Replace entire responses (NO merge) + update score ──────────────
  const Model = getResultModel(foundExam);
  await Model.findByIdAndUpdate(id, {
    responses: cleanedResponses,
    marks: result.marks,
    correct: result.correct,
    incorrect: result.incorrect,
    unattempted: result.unattempted,
  });

  logger.info("recalculated", { id, exam: foundExam, marks: result.marks });

  // Invalidate Redis cache for this result
  try {
    const { invalidateResultCache } = require("../middleware/cache");
    await invalidateResultCache(id);
  } catch { /* Redis down → ignore */ }

  res.json({
    success: true,
    marks: result.marks,
    correct: result.correct,
    incorrect: result.incorrect,
    unattempted: result.unattempted,
    sections: result.sections || null,
  });
}

module.exports = { recalculate };
