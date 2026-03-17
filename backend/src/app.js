const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");
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

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/admin", adminRoutes);
  app.use("/api", uploadRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

