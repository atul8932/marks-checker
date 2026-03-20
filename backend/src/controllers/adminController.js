const mongoose = require("mongoose");
const { Job } = require("bullmq");
const { getResultModel } = require("../models/Result");
const { logger } = require("../utils/logger");

const SUPPORTED_EXAMS = ["nimcet", "cuet", "rrb"];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Helper: resolve and clamp pagination params */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** Helper: get BullMQ queue (lazy-loaded) */
let _queue = null;
function getQueue() {
  if (!_queue) _queue = require("../jobs/queues").parseQueue;
  return _queue;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────────────────────
async function getStats(req, res) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Query all exam collections in parallel
  const examResults = await Promise.allSettled(
    SUPPORTED_EXAMS.map(async (exam) => {
      const Model = getResultModel(exam);
      const [total, today, marksAgg] = await Promise.all([
        Model.countDocuments(),
        Model.countDocuments({ createdAt: { $gte: startOfDay } }),
        Model.aggregate([{ $group: { _id: null, avg: { $avg: "$marks" }, sum: { $sum: "$marks" }, count: { $sum: 1 } } }]),
      ]);
      return { exam, total, today, avg: marksAgg[0]?.avg ?? 0, sum: marksAgg[0]?.sum ?? 0, count: marksAgg[0]?.count ?? 0 };
    })
  );

  const byExam = {};
  let totalResults = 0;
  let uploadsToday = 0;
  let totalMarksSum = 0;
  let totalMarksCount = 0;

  for (const r of examResults) {
    if (r.status === "fulfilled") {
      const { exam, total, today, sum, count } = r.value;
      byExam[exam] = { total, today };
      totalResults += total;
      uploadsToday += today;
      totalMarksSum += sum;
      totalMarksCount += count;
    }
  }

  const avgMarks = totalMarksCount > 0 ? Math.round((totalMarksSum / totalMarksCount) * 100) / 100 : 0;

  // BullMQ counts
  let jobCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  try {
    const queue = getQueue();
    const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    jobCounts = counts;
  } catch (err) {
    logger.warn("admin_stats_queue_error", { message: err.message });
  }

  logger.info("admin_action", { action: "getStats", adminIp: req.ip });

  res.json({
    success: true,
    data: {
      totalResults,
      uploadsToday,
      avgMarks,
      byExam,
      jobs: jobCounts,
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/results
// ─────────────────────────────────────────────────────────────────────────────
async function getResults(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const examParam = String(req.query.exam || "all").toLowerCase();

  if (examParam !== "all" && !SUPPORTED_EXAMS.includes(examParam)) {
    return res.status(400).json({ success: false, error: "Invalid exam filter. Use: all, nimcet, cuet, rrb" });
  }

  const targetExams = examParam === "all" ? SUPPORTED_EXAMS : [examParam];

  // Query each exam collection, strip heavy fields
  const queries = targetExams.map(async (exam) => {
    const Model = getResultModel(exam);
    const docs = await Model.find({})
      .select("-responses -answerKey")
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((d) => ({ ...d, exam }));
  });

  const settled = await Promise.allSettled(queries);
  let allDocs = [];
  for (const r of settled) {
    if (r.status === "fulfilled") allDocs = allDocs.concat(r.value);
  }

  // Sort merged results by createdAt DESC
  allDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allDocs.length;
  const results = allDocs.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);

  logger.info("admin_action", { action: "getResults", adminIp: req.ip, exam: examParam, page, limit });

  res.json({ success: true, data: { results, total, page, totalPages, limit } });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/jobs
// ─────────────────────────────────────────────────────────────────────────────
async function getJobs(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const VALID_STATUSES = ["active", "waiting", "completed", "failed", "delayed"];
  const statusParam = String(req.query.status || "all").toLowerCase();

  if (statusParam !== "all" && !VALID_STATUSES.includes(statusParam)) {
    return res.status(400).json({ success: false, error: `Invalid status. Use: all, ${VALID_STATUSES.join(", ")}` });
  }

  const statuses = statusParam === "all" ? VALID_STATUSES : [statusParam];

  let jobs = [];
  try {
    const queue = getQueue();
    const start = skip;
    const end = skip + limit - 1;
    const rawJobs = await queue.getJobs(statuses, start, end);

    // Resolve state for each job
    jobs = await Promise.all(
      rawJobs.map(async (job) => {
        let state = "unknown";
        try { state = await job.getState(); } catch { /* ignore */ }
        return {
          id: job.id,
          name: job.name,
          state,
          progress: job.progress || 0,
          exam: job.data?.exam,
          fileName: job.data?.fileName,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason || null,
          processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
          finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
          timestamp: job.timestamp ? new Date(job.timestamp).toISOString() : null,
        };
      })
    );
  } catch (err) {
    logger.error("admin_jobs_error", { message: err.message });
    return res.status(503).json({ success: false, error: "Queue unavailable", message: err.message });
  }

  logger.info("admin_action", { action: "getJobs", adminIp: req.ip, status: statusParam, page });

  res.json({ success: true, data: { jobs, page, limit, total: jobs.length } });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/job/:id/retry
// ─────────────────────────────────────────────────────────────────────────────
async function retryJob(req, res) {
  const jobId = String(req.params.id || "").trim();
  if (!jobId) {
    return res.status(400).json({ success: false, error: "Job ID is required" });
  }

  let job;
  try {
    const queue = getQueue();
    job = await Job.fromId(queue, jobId);
  } catch (err) {
    return res.status(503).json({ success: false, error: "Queue unavailable", message: err.message });
  }

  if (!job) {
    return res.status(404).json({ success: false, error: "Job not found" });
  }

  // Guard: only retry failed jobs
  const state = await job.getState();
  if (state !== "failed") {
    return res.status(400).json({
      success: false,
      error: "Job is not in failed state",
      currentState: state,
    });
  }

  await job.retry();

  logger.info("admin_action", { action: "retryJob", adminIp: req.ip, jobId });

  res.json({ success: true, jobId, message: "Job queued for retry" });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/health
// ─────────────────────────────────────────────────────────────────────────────
async function getHealth(req, res) {
  // 1. MongoDB
  const readyStateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  const mongoStatus = readyStateMap[mongoose.connection.readyState] || "unknown";

  // 2. Redis — ping with 2 s timeout
  let redisStatus = "down";
  try {
    const { createRedisConnection } = require("../config/redis");
    const redisConn = createRedisConnection();
    const pingPromise = redisConn.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 2000)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    redisStatus = "connected";
    redisConn.disconnect();
  } catch (err) {
    redisStatus = err.message === "timeout" ? "timeout" : "down";
  }

  // 3. Parser — fetch with 3 s AbortSignal timeout
  let parserStatus = "down";
  let parserDetail = null;
  try {
    const parserUrl = req.app.locals.parserUrl || "";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${parserUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    parserStatus = resp.ok ? "ok" : "degraded";
    parserDetail = await resp.json().catch(() => null);
  } catch (err) {
    parserStatus = err.name === "AbortError" ? "timeout" : "down";
  }

  logger.info("admin_action", { action: "getHealth", adminIp: req.ip });

  res.json({
    success: true,
    data: {
      mongo: mongoStatus,
      redis: redisStatus,
      parser: parserStatus,
      parserDetail,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { getStats, getResults, getJobs, retryJob, getHealth };
