/**
 * Redis cache middleware for GET endpoints.
 *
 * Usage:
 *   router.get("/result/:id", cacheResult(600), asyncHandler(getResult));
 *
 * - Checks Redis for a cached JSON response keyed by the full URL path.
 * - If cache hit: returns cached JSON immediately (skips controller).
 * - If cache miss: monkey-patches res.json to capture the response,
 *   stores it in Redis with TTL, then sends to client.
 *
 * Cache is automatically invalidated when:
 *   - TTL expires
 *   - Recalculate controller calls invalidateCache(key)
 */
const { getCacheClient } = require("../config/redis");

/**
 * @param {number} ttlSeconds — time-to-live in seconds (default 600 = 10 min)
 */
function cacheResult(ttlSeconds = 600) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const client = getCacheClient();
      const cached = await client.get(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json(parsed);
      }
    } catch (err) {
      // Redis down → skip cache, proceed to controller
      console.error("[Cache] read error:", err.message);
    }

    // Monkey-patch res.json to intercept the response
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Store in Redis (fire-and-forget)
      try {
        const client = getCacheClient();
        client.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch(() => {});
      } catch {
        // Redis down → ignore
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate a cached result by ID.
 * Call after recalculate to ensure stale data isn't served.
 */
async function invalidateResultCache(resultId) {
  try {
    const client = getCacheClient();
    await client.del(`cache:/api/result/${resultId}`);
  } catch {
    // Redis down → ignore
  }
}

module.exports = { cacheResult, invalidateResultCache };
