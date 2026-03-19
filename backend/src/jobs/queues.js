/**
 * BullMQ queue — production-hardened configuration.
 *
 * Job data shape (temp file mode):
 * {
 *   exam: "nimcet" | "cuet" | "rrb",
 *   filePath: string,           // absolute path to temp file
 *   answerKeyPath: string|null, // absolute path or null
 *   fileName: string,
 *   parserUrl: string,
 * }
 */
const { Queue } = require("bullmq");
const { createRedisConnection } = require("../config/redis");

const connection = createRedisConnection();

const parseQueue = new Queue("parse-pdf", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000, // 3s → 6s → 12s
    },
    // ── Memory management ───────────────────────────
    removeOnComplete: {
      age: 1800,   // remove completed jobs after 30 min
      count: 200,  // keep at most 200 completed jobs
    },
    removeOnFail: {
      age: 86400,  // remove failed jobs after 24 hours
      count: 100,  // keep at most 100 failed jobs
    },
  },
});

module.exports = { parseQueue };
