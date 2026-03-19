const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");
const recalculateRoutes = require("./routes/recalculate");
const resultRoutes = require("./routes/result");
const jobRoutes = require("./routes/job");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { logger, requestLogger } = require("./utils/logger");


function createApp({ parserUrl }) {
  const app = express();

  app.locals.parserUrl = parserUrl;

  app.use(helmet());
  app.use(requestLogger);
  app.use(
    morgan("combined", {
      stream: {
        write: (line) => logger.info("access", { line: String(line).trimEnd() }),
      },
    })
  );
  app.use(
    cors({
      origin: true,
      credentials: false,
    })
  );

  // ── JSON body parser ────────────────────────────────────
  app.use(express.json({ limit: "2mb" }));

  // ── Rate limiting: 100 requests per 15 minutes ─────────
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: "TooManyRequests", message: "Too many requests, please try again later." },
    })
  );

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/admin", adminRoutes);
  app.use("/api", uploadRoutes);
  app.use("/api", recalculateRoutes);
  app.use("/api", resultRoutes);
  app.use("/api", jobRoutes);

  // ── Bull Board dashboard ──────────────────────────────────
  try {
    const { setupBullBoard } = require("./jobs/bullBoard");
    setupBullBoard(app);
  } catch (err) {
    console.warn("[App] Bull Board not available:", err.message);
  }

  // ── Circuit breaker health ────────────────────────────────
  app.get("/health/parser", (req, res) => {
    try {
      const { parserBreaker } = require("./utils/circuitBreaker");
      res.json({ ok: true, circuit: parserBreaker.getStatus() });
    } catch {
      res.json({ ok: true, circuit: "not loaded" });
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

