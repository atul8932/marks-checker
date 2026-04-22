const { createApp } = require("./app");
const { connectMongo } = require("./config/db");
const { env } = require("./config/env");
const { isRedisAvailable } = require("./config/redis");

async function start() {
  await connectMongo(env.mongoUri);

  const asyncRequested = process.env.ASYNC_UPLOAD !== "false";
  const redisAvailable = asyncRequested ? await isRedisAvailable() : false;
  const asyncUploadEnabled = asyncRequested && redisAvailable;

  // ── Start BullMQ worker (in-process for Koyeb single-dyno) ──
  if (asyncUploadEnabled) {
    try {
      const { startParseWorker } = require("./jobs/parseWorker");
      startParseWorker({
        parserUrl: env.parserUrl,
        concurrency: Number(process.env.WORKER_CONCURRENCY || 2),
      });
      console.log("[Server] BullMQ worker started in-process");
    } catch (err) {
      console.error("[Server] Failed to start worker (Redis may be down):", err.message);
      console.log("[Server] Falling back to sync upload mode");
    }
  } else if (asyncRequested) {
    console.warn("[Server] Redis unavailable at startup. Async uploads disabled; using sync upload mode.");
  }

  const app = createApp({
    parserUrl: env.parserUrl,
    asyncUploadEnabled,
  });

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
