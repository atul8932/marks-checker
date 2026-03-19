/**
 * BullMQ Worker — production-hardened PDF parser.
 *
 * Improvements over v1:
 *  - Temp file storage (no base64 in Redis)
 *  - Circuit breaker for parser calls (fail fast when parser is down)
 *  - Job progress reporting (0–100)
 *  - Automatic temp file cleanup after processing
 *  - Stalled job detection
 *  - Structured logging
 */
const { Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
const { getResultModel } = require("../models/Result");
const { runNimcetPipeline } = require("../services/pipelines/nimcetPipeline");
const { runCuetPipeline } = require("../services/pipelines/cuetPipeline");
const { runRrbPipeline } = require("../services/pipelines/rrbPipeline");
const { readTempFile, cleanupTempFile, cleanupOldTempFiles } = require("../utils/tempFiles");
const { parserBreaker } = require("../utils/circuitBreaker");
const mongoose = require("mongoose");

/**
 * @param {{ parserUrl: string, concurrency?: number }} opts
 */
function startParseWorker({ parserUrl, concurrency = 2 }) {
  const connection = createRedisConnection();

  const worker = new Worker(
    "parse-pdf",
    async (job) => {
      const { exam, filePath, answerKeyPath, fileName } = job.data;
      const startTime = Date.now();

      console.log(`[Worker] Job ${job.id} started — exam=${exam}, file=${fileName}`);
      await job.updateProgress(5);

      // ── 1. Read temp files ──────────────────────────────────
      let file, answerKeyFile;
      try {
        file = readTempFile(filePath, fileName);
        answerKeyFile = answerKeyPath ? readTempFile(answerKeyPath, "answer-key.pdf") : null;
      } catch (err) {
        throw new Error(`File read failed: ${err.message}`);
      }

      await job.updateProgress(15);

      // ── 2. Run pipeline through circuit breaker ─────────────
      let pipelineResult;

      try {
        pipelineResult = await parserBreaker.exec(async () => {
          await job.updateProgress(25);

          if (exam === "nimcet") {
            return runNimcetPipeline({ parserUrl, file });
          } else if (exam === "cuet") {
            if (!answerKeyFile) throw new Error("Answer Key is required for CUET.");
            return runCuetPipeline({ parserUrl, file, answerKeyFile });
          } else if (exam === "rrb") {
            return runRrbPipeline({ parserUrl, file });
          } else {
            throw new Error(`Unsupported exam: ${exam}`);
          }
        });
      } catch (err) {
        // Attach circuit breaker state to error for debugging
        err.circuitState = parserBreaker.getStatus().state;
        throw err;
      }

      await job.updateProgress(70);

      // ── 3. Save to MongoDB ──────────────────────────────────
      const { name, app_no, roll_no } = pipelineResult.candidateDetails || {};
      const isIdentified =
        app_no && app_no !== "Unknown" && roll_no && roll_no !== "Unknown";

      const ResultModel = getResultModel(exam);

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

      await job.updateProgress(90);

      // ── 4. Cleanup temp files ───────────────────────────────
      cleanupTempFile(filePath);
      cleanupTempFile(answerKeyPath);

      const resultId = String(doc._id);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Worker] Job ${job.id} done in ${elapsed}s — resultId=${resultId}`);

      await job.updateProgress(100);

      return {
        resultId,
        exam,
        marks: pipelineResult.marks,
        correct: pipelineResult.correct,
        incorrect: pipelineResult.incorrect,
        unattempted: pipelineResult.unattempted,
        confidence: pipelineResult.confidence,
        sections: pipelineResult.sections || null,
        candidateDetails: pipelineResult.candidateDetails,
        responses: pipelineResult.responses,
        ...(pipelineResult.warning ? { warning: pipelineResult.warning } : {}),
        processingTimeMs: Date.now() - startTime,
      };
    },
    {
      connection,
      concurrency,
      limiter: {
        max: 5,
        duration: 10_000,
      },
      // Stalled job detection
      stalledInterval: 30_000,     // check every 30s
      maxStalledCount: 2,          // mark as failed after 2 stalls
      lockDuration: 120_000,       // job lock for 2 min (parser can be slow)
    }
  );

  // ── Events ──────────────────────────────────────────────────
  worker.on("completed", (job) => {
    console.log(`[Worker] ✓ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker] ✗ Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`
    );
    // Cleanup temp files on failure too
    if (job?.data?.filePath) cleanupTempFile(job.data.filePath);
    if (job?.data?.answerKeyPath) cleanupTempFile(job.data.answerKeyPath);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled`);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Error:", err.message);
  });

  // ── Periodic orphan cleanup (every 15 min) ─────────────────
  setInterval(() => cleanupOldTempFiles(30 * 60 * 1000), 15 * 60 * 1000);

  console.log(`[Worker] Started (concurrency=${concurrency}, stalledInterval=30s, lockDuration=120s)`);
  return worker;
}

module.exports = { startParseWorker };
