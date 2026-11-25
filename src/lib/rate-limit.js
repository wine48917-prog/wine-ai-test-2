import crypto from 'node:crypto';
import pool, { ensureDatabase } from '../../db.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const AUTH_FAIL_WINDOW_MS = 10 * 60_000;
const MAX_AUTH_FAILS = 10;
// Best-effort fallback for brief database outages; database limits remain primary.
const localBuckets = new Map();

function keyFor(prefix, identifier) {
  const digest = crypto.createHash('sha256').update(String(identifier || 'unknown')).digest('hex');
  return `${prefix}:${digest}`;
}

function localIncrement(key, windowMs) {
  const now = Date.now();
  let entry = localBuckets.get(key);
  if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  localBuckets.set(key, entry);
  if (localBuckets.size > 5000) {
    for (const [k, v] of localBuckets) if (v.resetAt <= now) localBuckets.delete(k);
    if (localBuckets.size > 5000) localBuckets.delete(localBuckets.keys().next().value);
  }
  return entry;
}

async function increment(key, windowMs) {
  await ensureDatabase();
  const now = Date.now();
  const resetAt = now + windowMs;
  await pool.query(
    'INSERT INTO rate_limits (rk, cnt, reset_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE cnt = IF(reset_at <= ?, 1, cnt + 1), reset_at = IF(reset_at <= ?, VALUES(reset_at), reset_at)',
    [key, resetAt, now, now]
  );
  const [rows] = await pool.query('SELECT cnt, reset_at FROM rate_limits WHERE rk = ? LIMIT 1', [key]);
  return { count: Number(rows[0]?.cnt || 0), resetAt: Number(rows[0]?.reset_at || resetAt) };
}

export async function checkRateLimit(identifier) {
  const key = keyFor('rl', identifier);
  try { return (await increment(key, WINDOW_MS)).count <= MAX_REQUESTS; }
  catch (error) {
    console.error('[rate-limit] database unavailable; using temporary local limit:', error.message);
    return localIncrement(key, WINDOW_MS).count <= MAX_REQUESTS;
  }
}

export async function recordAuthFail(identifier) {
  const key = keyFor('af', identifier);
  try { return (await increment(key, AUTH_FAIL_WINDOW_MS)).count; }
  catch (error) {
    console.error('[auth-rate-limit] database unavailable; using temporary local limit:', error.message);
    return localIncrement(key, AUTH_FAIL_WINDOW_MS).count;
  }
}

export async function isAuthBlocked(identifier) {
  const key = keyFor('af', identifier);
  try {
    await ensureDatabase();
    const [rows] = await pool.query('SELECT cnt, reset_at FROM rate_limits WHERE rk = ? LIMIT 1', [key]);
    const row = rows[0];
    return Boolean(row && Number(row.reset_at) > Date.now() && Number(row.cnt) >= MAX_AUTH_FAILS);
  } catch (error) {
    console.error('[auth-rate-limit] database unavailable; using temporary local check:', error.message);
    const row = localBuckets.get(key);
    return Boolean(row && row.resetAt > Date.now() && row.count >= MAX_AUTH_FAILS);
  }
}