const { createApp } = require("./app");
const { connectMongo } = require("./config/db");
const { env } = require("./config/env");

async function start() {
  await connectMongo(env.mongoUri);

  // ── Start BullMQ worker (in-process for Koyeb single-dyno) ──
  if (process.env.ASYNC_UPLOAD !== "false") {
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
  }

  const app = createApp({ parserUrl: env.parserUrl });

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
