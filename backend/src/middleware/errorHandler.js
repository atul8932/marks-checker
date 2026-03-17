function notFound(req, res, next) {
  res.status(404).json({
    error: "NotFound",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number(err.statusCode || err.status || 500);
  const code = err.code || "ServerError";
  const message =
    err.expose === false && status >= 500 ? "Internal server error" : err.message;

  try {
    const { logger } = require("../utils/logger");
    logger.error("error", {
      code,
      status,
      message: err?.message,
      path: req?.originalUrl,
      method: req?.method,
    });
  } catch {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: code, message });
}

module.exports = { notFound, errorHandler };

