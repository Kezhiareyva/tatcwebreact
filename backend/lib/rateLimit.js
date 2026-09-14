// Simple in-memory rate limiter for backend API protection
const tracker = new Map();

// Periodic sweep to clean up expired entries every 5 minutes
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, record] of tracker.entries()) {
    if (record.resetAt <= now) {
      tracker.delete(key);
    }
  }
}

/**
 * Checks if the request under a given key exceeds rate limit.
 * @param {string} key - Unique identifier (e.g., `login:ip_address`)
 * @param {number} maxRequests - Max permitted requests in window
 * @param {number} windowSeconds - Window duration in seconds
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(key, maxRequests = 10, windowSeconds = 60) {
  sweep();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = tracker.get(key);

  if (!record || record.resetAt <= now) {
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

/**
 * Resolves client IP address from standard reverse-proxy headers.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    if (ips[0]) return ips[0];
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
