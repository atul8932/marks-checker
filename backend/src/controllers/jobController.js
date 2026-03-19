/**
 * GET /api/job/:jobId
 *
 * Enhanced job status with progress (0–100) and ETA.
 */
const { parseQueue } = require("../jobs/queues");

// Track average processing time (rolling window)
const recentTimes = [];
const MAX_SAMPLES = 20;

function recordProcessingTime(ms) {
  recentTimes.push(ms);
  if (recentTimes.length > MAX_SAMPLES) recentTimes.shift();
}

function getAvgProcessingTime() {
  if (recentTimes.length === 0) return 12_000; // default 12s estimate
  return recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
}

async function getJobStatus(req, res) {
  const { jobId } = req.params;

  const job = await parseQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found or expired.",
    });
  }

  const state = await job.getState();
  const progress = typeof job.progress === "number" ? job.progress : 0;

  const response = {
    success: true,
    jobId: job.id,
    status: state,
    progress,
  };

  // ── Queued ────────────────────────────────────────────────
  if (state === "waiting" || state === "delayed") {
    response.status = "queued";

    // Queue position estimate
    const waiting = await parseQueue.getWaitingCount();
    response.position = waiting;
    response.eta = Math.ceil((waiting + 1) * getAvgProcessingTime() / 1000);
  }

  // ── Active ────────────────────────────────────────────────
  if (state === "active") {
    const elapsed = Date.now() - (job.processedOn || job.timestamp);
    const avgTime = getAvgProcessingTime();
    const remaining = Math.max(0, avgTime - elapsed);
    response.eta = Math.ceil(remaining / 1000);
  }

  // ── Completed ─────────────────────────────────────────────
  if (state === "completed") {
    response.result = job.returnvalue;

    // Record processing time for future ETA estimates
    if (job.returnvalue?.processingTimeMs) {
      recordProcessingTime(job.returnvalue.processingTimeMs);
    }
  }

  // ── Failed ────────────────────────────────────────────────
  if (state === "failed") {
    response.error = job.failedReason || "Unknown error";
    response.attempts = job.attemptsMade;
    response.maxAttempts = job.opts?.attempts || 3;
  }

  res.json(response);
}

module.exports = { getJobStatus };
