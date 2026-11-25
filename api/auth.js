import crypto from 'node:crypto';
import pool, { ensureDatabase } from '../db.js';
import { signToken } from '../src/lib/jwt.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';
import { checkRateLimit, recordAuthFail, isAuthBlocked } from '../src/lib/rate-limit.js';

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
    const [, iterationsText, salt, expectedHash] = parts;
    const iterations = Number.parseInt(iterationsText, 10);
    if (!Number.isFinite(iterations) || iterations < 10000) return false;
    const actual = crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST);
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!(await checkRateLimit('auth:' + clientIp))) return res.status(429).json({ success: false, error: 'محاولات كثيرة. حاول بعد دقيقة.' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ success: false, error: 'Invalid JSON' }); }

  const { action, email, password } = body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ success: false, error: 'إعدادات تسجيل الدخول غير مكتملة على السيرفر' });
    }
    await ensureDatabase();

    if (action === 'signup') {
      if (!EMAIL_RE.test(normalizedEmail) || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, error: 'أدخل بريداً إلكترونياً صحيحاً وكلمة مرور من 6 أحرف على الأقل' });
      }

      const hashed = hashPassword(password);
      const uuid = crypto.randomUUID();
      await pool.query(
        'INSERT INTO users (uuid, device_id, email, password_hash, usage_count, reset_time, is_dev) VALUES (?, ?, ?, ?, 0, 0, 0)',
        [uuid, 'auth_' + uuid, normalizedEmail, hashed]
      );

      const token = signToken({ uid: uuid, email: normalizedEmail });
      return res.status(201).json({ success: true, token, uuid, email: normalizedEmail });
    }

    if (action === 'login') {
      const authKey = 'login:' + clientIp + ':' + normalizedEmail;
      if (await isAuthBlocked(authKey)) return res.status(429).json({ success: false, error: 'تم إيقاف محاولات الدخول مؤقتاً. حاول بعد 10 دقائق.' });
      if (!EMAIL_RE.test(normalizedEmail) || typeof password !== 'string' || !password) {
        return res.status(400).json({ success: false, error: 'أدخل البريد الإلكتروني وكلمة المرور' });
      }
      const [rows] = await pool.query(
        'SELECT uuid, email, password_hash FROM users WHERE email = ? LIMIT 1',
        [normalizedEmail]
      );
      const user = rows[0];
      if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
        await recordAuthFail(authKey);
        return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }
      const token = signToken({ uid: user.uuid, email: user.email });
      return res.status(200).json({ success: true, token, uuid: user.uuid, email: user.email });
    }

    return res.status(400).json({ success: false, error: 'طلب غير معروف' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'هذا البريد مسجل بالفعل' });
    }
    console.error('[auth error]', error.message);
    return res.status(503).json({ success: false, error: 'تعذّر الاتصال بقاعدة البيانات أو تجهيز جداول الحسابات' });
  }
}
