/**
 * Circuit breaker for the Python parser service.
 *
 * Prevents cascading failures when the parser is down or slow.
 *
 * States:
 *   CLOSED  → normal operation, requests go through
 *   OPEN    → parser is unhealthy, requests fail fast
 *   HALF    → testing if parser recovered (1 request allowed)
 *
 * Config:
 *   failureThreshold: 3 consecutive failures → open the circuit
 *   resetTimeout: 30s → try again after this period
 *   requestTimeout: 45s → individual request timeout
 */

const STATES = { CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" };

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 30_000;   // 30s
    this.requestTimeout = options.requestTimeout || 45_000; // 45s

    this.state = STATES.CLOSED;
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  /**
   * Execute a function through the circuit breaker.
   * @param {() => Promise<T>} fn — the async function to protect
   * @returns {Promise<T>}
   */
  async exec(fn) {
    // ── OPEN: fail fast ─────────────────────────────────────
    if (this.state === STATES.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;

      if (elapsed < this.resetTimeout) {
        throw new Error(
          `Circuit breaker OPEN — parser is unhealthy. Retry in ${Math.ceil((this.resetTimeout - elapsed) / 1000)}s.`
        );
      }

      // Reset timeout expired → try one request
      this.state = STATES.HALF_OPEN;
      console.log("[CircuitBreaker] Transitioning to HALF_OPEN");
    }

    // ── Execute with timeout ────────────────────────────────
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Parser request timed out")), this.requestTimeout)
        ),
      ]);

      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    if (this.state === STATES.HALF_OPEN) {
      console.log("[CircuitBreaker] Parser recovered — closing circuit");
    }
    this.failures = 0;
    this.state = STATES.CLOSED;
    this.successCount++;
  }

  _onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = STATES.OPEN;
      console.error(`[CircuitBreaker] OPENED after ${this.failures} failures`);
    }
  }

  /** Get current breaker status (for monitoring). */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
    };
  }
}

// Singleton breaker for the parser
const parserBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30_000,
  requestTimeout: 45_000,
});

module.exports = { CircuitBreaker, parserBreaker };
