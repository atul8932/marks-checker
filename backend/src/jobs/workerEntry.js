/**
 * Standalone worker entry point.
 *
 * Run: node src/jobs/workerEntry.js
 *
 * This is for running the worker as a separate process/container.
 * Connects to MongoDB independently and starts the parse worker.
 */
const { connectMongo } = require("../config/db");
const { env } = require("../config/env");
const { startParseWorker } = require("./parseWorker");

async function main() {
  console.log("[WorkerEntry] Connecting to MongoDB...");
  await connectMongo(env.mongoUri);
  console.log("[WorkerEntry] MongoDB connected");

  startParseWorker({
    parserUrl: env.parserUrl,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 3),
  });
}

main().catch((err) => {
  console.error("[WorkerEntry] Fatal:", err);
  process.exit(1);
});
