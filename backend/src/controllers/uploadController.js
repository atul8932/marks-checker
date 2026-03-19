const { getResultModel } = require("../models/Result");
const { runNimcetPipeline } = require("../services/pipelines/nimcetPipeline");
const { runCuetPipeline } = require("../services/pipelines/cuetPipeline");
const { runRrbPipeline } = require("../services/pipelines/rrbPipeline");
const { logger } = require("../utils/logger");

// BullMQ queue (lazy-loaded so the import doesn't crash if Redis is down)
let _parseQueue = null;
function getQueue() {
  if (!_parseQueue) {
    _parseQueue = require("../jobs/queues").parseQueue;
  }
  return _parseQueue;
}

/**
 * POST /api/upload
 *
 * Supports two modes controlled by ASYNC_UPLOAD env var:
 *
 *  ASYNC (default when Redis is available):
 *    → Enqueues a BullMQ job, returns { jobId } immediately.
 *    → Frontend polls GET /api/job/:jobId until completed.
 *
 *  SYNC (fallback):
 *    → Runs the pipeline synchronously (old behaviour).
 *    → Returns the full result immediately.
 */
async function uploadAndScore(req, res) {
  const exam = String(req.body.exam || "nimcet").toLowerCase();

  const files = req.files || {};
  const file = files.file ? files.file[0] : null;
  const answerKeyFile = files.answerKeyFile ? files.answerKeyFile[0] : null;

  if (!file) {
    const err = new Error("PDF file is required.");
    err.statusCode = 400;
    err.code = "MissingFile";
    throw err;
  }

  if (exam === "cuet" && !answerKeyFile) {
    const err = new Error("Answer Key PDF is required for CUET.");
    err.statusCode = 400;
    err.code = "MissingAnswerKey";
    throw err;
  }

  const supportedExams = ["nimcet", "cuet", "rrb"];
  if (!supportedExams.includes(exam)) {
    const err = new Error(`Unsupported exam: ${exam}`);
    err.statusCode = 400;
    err.code = "UnsupportedExam";
    throw err;
  }

  // ── ASYNC MODE ────────────────────────────────────────────────
  const useAsync = process.env.ASYNC_UPLOAD !== "false";

  if (useAsync) {
    try {
      const queue = getQueue();
      const { saveTempFile } = require("../utils/tempFiles");

      // Write to temp files instead of base64-encoding into Redis
      const filePath = saveTempFile(file.buffer, file.originalname);
      const answerKeyPath = answerKeyFile
        ? saveTempFile(answerKeyFile.buffer, answerKeyFile.originalname)
        : null;

      const job = await queue.add(
        `parse-${exam}`,
        {
          exam,
          filePath,
          answerKeyPath,
          fileName: file.originalname,
          parserUrl: req.app.locals.parserUrl,
        },
        {
          priority: exam === "nimcet" ? 1 : 2,
        }
      );

      logger.info("job_queued", { jobId: job.id, exam, fileName: file.originalname });

      return res.status(202).json({
        success: true,
        mode: "async",
        jobId: job.id,
        message: "PDF uploaded. Processing in background.",
      });
    } catch (queueErr) {
      // If Redis/BullMQ is down, fall through to sync mode
      logger.error("queue_error", { message: queueErr.message });
      logger.info("fallback_sync", { reason: "Queue unavailable, running synchronously" });
    }
  }

  // ── SYNC MODE (fallback) ──────────────────────────────────────
  const parserUrl = req.app.locals.parserUrl;
  let pipelineResult;

  if (exam === "nimcet") {
    pipelineResult = await runNimcetPipeline({ parserUrl, file });
  } else if (exam === "cuet") {
    pipelineResult = await runCuetPipeline({ parserUrl, file, answerKeyFile });
  } else if (exam === "rrb") {
    pipelineResult = await runRrbPipeline({ parserUrl, file });
  }

  const { name, app_no, roll_no } = pipelineResult.candidateDetails || {};
  const isIdentified =
    app_no && app_no !== "Unknown" && roll_no && roll_no !== "Unknown";

  const ResultModel = getResultModel(exam);
  const mongoose = require("mongoose");

  const query = isIdentified
    ? { applicationNo: app_no, rollNo: roll_no }
    : { _id: new mongoose.Types.ObjectId() };

  const doc = await ResultModel.findOneAndUpdate(
    query,
    {
      exam,
      name: name || "Unknown",
      applicationNo: app_no || "Unknown",
      rollNo: roll_no || "Unknown",
      marks: pipelineResult.marks,
      correct: pipelineResult.correct,
      incorrect: pipelineResult.incorrect,
      unattempted: pipelineResult.unattempted,
      responses: pipelineResult.responses,
      answerKey: pipelineResult.answerKey || {},
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  logger.info("result_saved_sync", { id: String(doc._id), exam });

  res.json({
    success: true,
    mode: "sync",
    resultId: String(doc._id),
    marks: pipelineResult.marks,
    correct: pipelineResult.correct,
    incorrect: pipelineResult.incorrect,
    unattempted: pipelineResult.unattempted,
    confidence: pipelineResult.confidence,
    sections: pipelineResult.sections,
    candidateDetails: pipelineResult.candidateDetails,
    responses: pipelineResult.responses,
    ...(pipelineResult.warning ? { warning: pipelineResult.warning } : null),
  });
}

module.exports = { uploadAndScore };
