// src/lib/rate-limit.js
import pool from '../../db.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const AUTH_FAIL_WINDOW_MS = 10 * 60_000;
const MAX_AUTH_FAILS = 10;

async function bump(key, windowMs) {
  const now = Date.now();
  const reset = now + windowMs;
  try {
    await pool.query(
      `INSERT INTO rate_limits (rk, cnt, reset_at) VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         cnt = IF(reset_at <= VALUES(reset_at), 1, cnt + 1),
         reset_at = IF(reset_at <= VALUES(reset_at), VALUES(reset_at), reset_at)`,
      [key, reset]
    );
    const [rows] = await pool.query('SELECT cnt, reset_at FROM rate_limits WHERE rk = ? LIMIT 1', [key]);
    return rows[0] || { cnt: 1, reset_at: reset };
  } catch (err) {
    console.error('[rate-limit] DB error:', err.message);
    // fail-open (اسمح بالطلب) — أفضل من رفض كل الطلبات لو DB وقع
    return { cnt: 0, reset_at: reset };
  }
}

export async function checkRateLimit(identifier) {
  const entry = await bump(`rl:${identifier}`, WINDOW_MS);
  return entry.cnt <= MAX_REQUESTS;
}

export async function recordAuthFail(identifier) {
  const entry = await bump(`af:${identifier}`, AUTH_FAIL_WINDOW_MS);
  return entry.cnt <= MAX_AUTH_FAILS;
}

export async function isAuthBlocked(identifier) {
  try {
    const [rows] = await pool.query('SELECT cnt, reset_at FROM rate_limits WHERE rk = ? LIMIT 1', [`af:${identifier}`]);
    if (!rows[0]) return false;
    if (rows[0].reset_at <= Date.now()) return false;
    return rows[0].cnt >= MAX_AUTH_FAILS;
  } catch { return false; }
}
