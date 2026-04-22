/**
 * Redis connection factory for BullMQ and caching.
 *
 * Supports:
 *  - Upstash Redis (TLS via rediss://)
 *  - Railway Redis
 *  - Local Redis via docker-compose
 *
 * Set REDIS_URL in .env, e.g.:
 *   REDIS_URL=rediss://default:xxx@your-instance.upstash.io:6379
 *   REDIS_URL=redis://localhost:6379
 */
const IORedis = require("ioredis");

function createRedisConnection({ logErrors = true, ...overrides } = {}) {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  const opts = {
    maxRetriesPerRequest: null,   // required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      // exponential back-off: 500ms, 1s, 2s, 4s … up to 30s
      return Math.min(times * 500, 30_000);
    },
    ...overrides,
  };

  // Upstash / TLS connections
  if (url.startsWith("rediss://")) {
    opts.tls = { rejectUnauthorized: false };
  }

  const connection = new IORedis(url, opts);

  if (logErrors) {
    connection.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });
  }

  return connection;
}

async function isRedisAvailable(timeoutMs = 1000) {
  const connection = createRedisConnection({
    logErrors: false,
    lazyConnect: true,
    connectTimeout: timeoutMs,
    commandTimeout: timeoutMs,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  try {
    await connection.connect();
    return (await connection.ping()) === "PONG";
  } catch {
    return false;
  } finally {
    try {
      await connection.quit();
    } catch {
      connection.disconnect();
    }
  }
}

/**
 * Singleton connection for caching (shared across requests).
 * Lazily created on first access.
 */
let _cacheClient = null;

function getCacheClient() {
  if (!_cacheClient) {
    _cacheClient = createRedisConnection();
  }
  return _cacheClient;
}

module.exports = { createRedisConnection, isRedisAvailable, getCacheClient };
