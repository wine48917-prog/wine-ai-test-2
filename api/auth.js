import { maintenanceGuard } from '../src/lib/site-control.js';
import crypto from 'node:crypto';
import pool, { ensureDatabase } from '../db.js';
import { signToken, verifyToken } from '../src/lib/jwt.js';
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
  if (await maintenanceGuard(req, res)) return;
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });

  let body = {};
  if (req.method === 'POST') {
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
    catch { return res.status(400).json({ success: false, error: 'Invalid JSON' }); }
  }

  const accountAction = req.method === 'GET' || ['saveConversation', 'deleteConversation'].includes(body.action);
  if (accountAction) {
    const rawToken = String(req.headers['x-user-token'] || req.headers.authorization || '');
    const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
    const payload = verifyToken(token);
    if (!payload?.uid || payload.guest) return res.status(401).json({ success: false, error: 'سجّل الدخول بحسابك للوصول إلى بياناتك المحفوظة.' });

    try {
      if (!(await checkRateLimit('account-data:' + payload.uid))) {
        return res.status(429).json({ success: false, error: 'طلبات كثيرة. حاول بعد قليل.' });
      }
      await ensureDatabase();
      const [users] = await pool.query('SELECT uuid, email, created_at, usage_count FROM users WHERE uuid = ? LIMIT 1', [payload.uid]);
      const user = users[0];
      if (!user) return res.status(401).json({ success: false, error: 'الحساب غير موجود أو انتهت صلاحيته.' });

      if (req.method === 'GET') {
        const id = typeof req.query?.id === 'string' ? req.query.id : '';
        if (id) {
          const [rows] = await pool.query(
            'SELECT conversation_id, title, session_id, messages_json, created_at, updated_at FROM user_conversations WHERE user_uuid = ? AND conversation_id = ? LIMIT 1',
            [user.uuid, id]
          );
          if (!rows[0]) return res.status(404).json({ success: false, error: 'المحادثة غير موجودة.' });
          let messages = [];
          try { messages = JSON.parse(rows[0].messages_json || '[]'); } catch { messages = []; }
          return res.status(200).json({ success: true, conversation: {
            id: rows[0].conversation_id, title: rows[0].title, sessionId: rows[0].session_id,
            messages, createdAt: rows[0].created_at, updatedAt: rows[0].updated_at
          }});
        }
        const [rows] = await pool.query(
          'SELECT conversation_id, title, updated_at FROM user_conversations WHERE user_uuid = ? ORDER BY updated_at DESC LIMIT 100',
          [user.uuid]
        );
        return res.status(200).json({
          success: true,
          profile: { email: user.email, createdAt: user.created_at, usageCount: Number(user.usage_count || 0) },
          conversations: rows.map(row => ({ id: row.conversation_id, title: row.title, updatedAt: row.updated_at }))
        });
      }

      if (body.action === 'saveConversation') {
        const id = typeof body.id === 'string' ? body.id.trim() : '';
        const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : 'محادثة جديدة';
        const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 16000) : null;
        if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return res.status(400).json({ success: false, error: 'معرّف المحادثة غير صالح.' });
        if (!Array.isArray(body.messages) || body.messages.length > 100) return res.status(400).json({ success: false, error: 'سجل المحادثة غير صالح.' });
        let total = 0;
        const safeMessages = [];
        for (const item of body.messages) {
          if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') {
            return res.status(400).json({ success: false, error: 'توجد رسالة غير صالحة في المحادثة.' });
          }
          total += item.text.length;
          if (item.text.length > 30000 || total > 250000) return res.status(413).json({ success: false, error: 'حجم المحادثة أكبر من الحد المسموح.' });
          safeMessages.push({ role: item.role, text: item.text });
        }
        await pool.query(
          `INSERT INTO user_conversations (user_uuid, conversation_id, title, session_id, messages_json)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title), session_id = VALUES(session_id), messages_json = VALUES(messages_json), updated_at = CURRENT_TIMESTAMP`,
          [user.uuid, id, title || 'محادثة جديدة', sessionId, JSON.stringify(safeMessages)]
        );
        return res.status(200).json({ success: true, saved: true, id });
      }

      if (body.action === 'deleteConversation') {
        const id = typeof body.id === 'string' ? body.id.trim() : '';
        if (!id) return res.status(400).json({ success: false, error: 'معرّف المحادثة مطلوب.' });
        const [result] = await pool.query('DELETE FROM user_conversations WHERE user_uuid = ? AND conversation_id = ?', [user.uuid, id]);
        return res.status(200).json({ success: true, deleted: result.affectedRows > 0 });
      }
    } catch (error) {
      console.error('[account data]', error?.message || error);
      return res.status(503).json({ success: false, error: 'تعذر الوصول إلى بيانات الحساب حالياً.' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!(await checkRateLimit('auth:' + clientIp))) return res.status(429).json({ success: false, error: 'محاولات كثيرة. حاول بعد دقيقة.' });

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
      const [rows] = await pool.query('SELECT uuid, email, password_hash FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
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
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: 'هذا البريد مسجل بالفعل' });
    console.error('[auth error]', error.message);
    return res.status(503).json({ success: false, error: 'تعذّر الاتصال بقاعدة البيانات أو تجهيز جداول الحسابات' });
  }
}
