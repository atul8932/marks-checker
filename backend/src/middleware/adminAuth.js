const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

/**
 * Dedicated rate-limiter for admin endpoints.
 * Stricter than the global limiter: 20 requests per 15 minutes per IP.
 */
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "TooManyRequests", message: "Too many admin requests. Try again later." },
  keyGenerator: (req) => req.ip,
});

/**
 * Verifies the Authorization: Bearer <token> header using
 * crypto.timingSafeEqual to prevent timing attacks.
 * Fails closed — if ADMIN_SECRET is not configured, every request is denied.
 */
function verifyAdminToken(req, res, next) {
  const secret = env.adminSecret;

  // Fail closed: if no secret is configured, deny all requests
  if (!secret) {
    logger.warn("admin_auth_fail", { ip: req.ip, reason: "ADMIN_SECRET not configured" });
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const authHeader = req.headers["authorization"] || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    logger.warn("admin_auth_fail", { ip: req.ip, reason: "Missing or malformed Authorization header" });
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = match[1];

  // Constant-time compare to prevent timing attacks
  let valid = false;
  try {
    const a = Buffer.from(token.padEnd(secret.length));
    const b = Buffer.from(secret.padEnd(token.length));
    // Must be same length for timingSafeEqual
    const tokenBuf = Buffer.alloc(Math.max(token.length, secret.length));
    const secretBuf = Buffer.alloc(Math.max(token.length, secret.length));
    Buffer.from(token).copy(tokenBuf);
    Buffer.from(secret).copy(secretBuf);
    valid = crypto.timingSafeEqual(tokenBuf, secretBuf) && token.length === secret.length;
  } catch {
    valid = false;
  }

  if (!valid) {
    logger.warn("admin_auth_fail", { ip: req.ip, reason: "Invalid token" });
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  logger.info("admin_auth_ok", { ip: req.ip, path: req.path });
  next();
}

/**
 * Composed middleware: rate limit first, then verify token.
 * Apply this array to any admin route.
 */
const adminAuth = [adminRateLimiter, verifyAdminToken];

module.exports = { adminAuth };
