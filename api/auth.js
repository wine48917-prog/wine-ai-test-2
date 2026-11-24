import crypto from 'node:crypto';
import pool from '../db.js';
import { signToken } from '../src/lib/jwt.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PBKDF2_ITERATIONS = 150_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split(':');
    if (parts.length !== 4) return false;
    const [, itersStr, salt, expectedHash] = parts;
    const iters = parseInt(itersStr, 10);
    if (!Number.isFinite(iters) || iters < 10_000) return false;
    const actualHash = crypto.pbkdf2Sync(password, salt, iters, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    const a = Buffer.from(actualHash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ success: false, error: 'Invalid JSON' }); }

  const { action, email, password } = body || {};

  try {
    if (action === 'signup') {
      if (!email || !EMAIL_RE.test(email) || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, error: 'البريد صالح وكلمة مرور 6 أحرف على الأقل مطلوبان' });
      }

      const hashed = hashPassword(password);
      const uuid = crypto.randomUUID();
      const deviceId = 'auth_' + uuid;

      try {
        await pool.query(
          'INSERT INTO users (uuid, device_id, email, password_hash, usage_count, reset_time, is_dev) VALUES (?, ?, ?, ?, 0, 0, 0)',
          [uuid, deviceId, email.toLowerCase().trim(), hashed]
        );
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, error: 'هذا البريد مسجل بالفعل' });
        }
        throw err;
      }

      const token = signToken({ uid: uuid, email });
      return res.status(200).json({ success: true, token, uuid, email });
    }

    if (action === 'login') {
      if (!email || typeof password !== 'string') {
        return res.status(400).json({ success: false, error: 'البريد وكلمة المرور مطلوبان' });
      }
      const [rows] = await pool.query(
        'SELECT uuid, email, password_hash FROM users WHERE email = ? LIMIT 1',
        [email.toLowerCase().trim()]
      );
      const user = rows[0];
      if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ success: false, error: 'البريد أو كلمة المرور غير صحيحة' });
      }
      const token = signToken({ uid: user.uuid, email: user.email });
      return res.status(200).json({ success: true, token, uuid: user.uuid, email: user.email });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (error) {
    console.error('[auth error]', error.message);
    return res.status(500).json({ success: false, error: 'حدث خطأ في السيرفر' });
  }
           }
