// Per-instance limiter for serverless requests.
// This avoids adding several database round-trips to every chat request.
// Limits are best-effort across Vercel instances; use a shared Redis/KV store
// if globally consistent limits are required.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const AUTH_FAIL_WINDOW_MS = 10 * 60_000;
const MAX_AUTH_FAILS = 10;
const buckets = new Map();

function getBucket(key, windowMs) {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;

  // Bound memory use in long-lived instances.
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
      if (buckets.size <= 8_000) break;
    }
  }
  return entry;
}

export async function checkRateLimit(identifier) {
  return getBucket(`rl:${identifier}`, WINDOW_MS).count <= MAX_REQUESTS;
}

export async function recordAuthFail(identifier) {
  return getBucket(`af:${identifier}`, AUTH_FAIL_WINDOW_MS).count <= MAX_AUTH_FAILS;
}

export async function isAuthBlocked(identifier) {
  const entry = buckets.get(`af:${identifier}`);
  return Boolean(entry && entry.resetAt > Date.now() && entry.count >= MAX_AUTH_FAILS);
}
