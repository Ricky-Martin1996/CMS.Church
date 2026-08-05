import { rateLimited } from "@/server/errors";

/**
 * Lightweight in-memory rate limiter for sensitive routes/actions.
 * Suitable for single-instance deployments; replace with Redis for multi-instance.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10_000;

function pruneIfNeeded() {
  if (buckets.size < MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) {
    const keys = [...buckets.keys()].slice(0, Math.floor(MAX_BUCKETS / 2));
    for (const key of keys) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  pruneIfNeeded();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1 };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: options.limit - existing.count };
}

export function assertRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
  message = "Too many requests. Please try again shortly."
): void {
  const result = rateLimit(key, options);
  if (!result.ok) {
    throw rateLimited(message);
  }
}

/** Common presets for ChurchOS sensitive operations. */
export const RateLimits = {
  onboard: { limit: 5, windowMs: 60_000 },
  csvImport: { limit: 5, windowMs: 60_000 },
  checkIn: { limit: 120, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  webhook: { limit: 300, windowMs: 60_000 },
  apiWrite: { limit: 60, windowMs: 60_000 },
} as const;
