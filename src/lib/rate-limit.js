import crypto from 'node:crypto';
import pool, { ensureDatabase } from '../../db.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const AUTH_FAIL_WINDOW_MS = 10 * 60_000;
const MAX_AUTH_FAILS = 10;

function keyFor(prefix, identifier) {
  const digest = crypto.createHash('sha256').update(String(identifier || 'unknown')).digest('hex');
  return `${prefix}:${digest}`;
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
  try {
    const result = await increment(keyFor('rl', identifier), WINDOW_MS);
    return result.count <= MAX_REQUESTS;
  } catch (error) {
    console.error('[rate-limit] storage unavailable:', error.message);
    return false;
  }
}

export async function recordAuthFail(identifier) {
  try {
    const result = await increment(keyFor('af', identifier), AUTH_FAIL_WINDOW_MS);
    return result.count;
  } catch (error) {
    console.error('[auth-rate-limit] storage unavailable:', error.message);
    return MAX_AUTH_FAILS + 1;
  }
}

export async function isAuthBlocked(identifier) {
  try {
    await ensureDatabase();
    const [rows] = await pool.query(
      'SELECT cnt, reset_at FROM rate_limits WHERE rk = ? LIMIT 1',
      [keyFor('af', identifier)]
    );
    const row = rows[0];
    return Boolean(row && Number(row.reset_at) > Date.now() && Number(row.cnt) >= MAX_AUTH_FAILS);
  } catch (error) {
    console.error('[auth-rate-limit] storage unavailable:', error.message);
    return true;
  }
}
