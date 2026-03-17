function nowIso() {
  return new Date().toISOString();
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return "\"[unserializable]\"";
  }
}

function log(level, msg, meta) {
  const line = {
    ts: nowIso(),
    level,
    msg,
    ...(meta ? { meta } : null),
  };
  const out = safeJson(line);
  // eslint-disable-next-line no-console
  (level === "error" ? console.error : console.log)(out);
}

const logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  debug: (msg, meta) => {
    if (process.env.LOG_LEVEL === "debug") log("debug", msg, meta);
  },
};

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info("request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
    });
  });
  next();
}

module.exports = { logger, requestLogger };

