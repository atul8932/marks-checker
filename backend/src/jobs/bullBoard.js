/**
 * Bull Board dashboard setup.
 *
 * Mounts a web UI at /admin/queues for monitoring job queues.
 * Shows: active, waiting, completed, failed, delayed jobs.
 *
 * In production, protect this route with auth middleware.
 */
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

function setupBullBoard(app) {
  let parseQueue;

  try {
    parseQueue = require("./queues").parseQueue;
  } catch {
    console.warn("[BullBoard] Could not load parseQueue — skipping dashboard");
    return;
  }

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(parseQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
  console.log("[BullBoard] Dashboard available at /admin/queues");
}

module.exports = { setupBullBoard };
