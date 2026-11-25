import crypto from 'node:crypto';
import pool, { ensureDatabase } from '../db.js';
import { verifyToken } from '../src/lib/jwt.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

const DAILY_IMAGE_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function getToken(req) {
  const header = String(req.headers['x-user-token'] || req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

async function incrementImageQuota(key, limit) {
  const now = Date.now();
  const resetAt = now + WINDOW_MS;
  await pool.query(
    'INSERT INTO rate_limits (rk, cnt, reset_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE cnt = IF(reset_at <= ?, 1, cnt + 1), reset_at = IF(reset_at <= ?, VALUES(reset_at), reset_at)',
    [key, resetAt, now, now]
  );
  const [rows] = await pool.query('SELECT cnt, reset_at FROM rate_limits WHERE rk = ? LIMIT 1', [key]);
  const count = Number(rows[0]?.cnt || 0);
  return { ok: count <= limit, count, resetAt: Number(rows[0]?.reset_at || resetAt), key };
}

async function consumeImageQuota(uid, ip) {
  await ensureDatabase();
  const userHash = crypto.createHash('sha256').update(String(uid)).digest('hex');
  const ipHash = crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex');
  const user = await incrementImageQuota('image:user:' + userHash, DAILY_IMAGE_LIMIT);
  if (!user.ok) return { ok: false, reason: 'user', key: user.key };
  const network = await incrementImageQuota('image:ip:' + ipHash, 20);
  if (!network.ok) {
    await refundImageQuota(user.key);
    return { ok: false, reason: 'ip', key: network.key };
  }
  return { ok: true, count: user.count, resetAt: user.resetAt, keys: [user.key, network.key] };
}
async function refundImageQuota(keys) {
  for (const key of Array.isArray(keys) ? keys : [keys]) {
    try { await pool.query('UPDATE rate_limits SET cnt = GREATEST(0, cnt - 1) WHERE rk = ?', [key]); } catch {}
  }
}

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const token = getToken(req);
  const identity = verifyToken(token);
  if (!identity?.uid) return res.status(401).json({ success: false, error: 'انتهت الجلسة. حدّث الصفحة وحاول مرة أخرى.' });

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > 1500) {
    return res.status(400).json({ success: false, error: 'اكتب وصفاً للصورة من 1 إلى 1500 حرف.' });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 20) {
    return res.status(503).json({ success: false, error: 'ميزة إنشاء الصور تحتاج إضافة GEMINI_API_KEY من Google AI Studio إلى إعدادات Vercel.' });
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!(await checkRateLimit('image:user:' + identity.uid)) || !(await checkRateLimit('image:ip:' + ip))) {
    return res.status(429).json({ success: false, error: 'طلبات إنشاء الصور كثيرة. حاول بعد دقيقة.' });
  }

  let quota;
  try {
    quota = await consumeImageQuota(identity.uid, ip);
  } catch (error) {
    console.error('[image quota]', error.message);
    return res.status(503).json({ success: false, error: 'تعذر التحقق من حد إنشاء الصور حالياً.' });
  }
  if (!quota.ok) {
    const message = quota.reason === 'ip' ? 'تم بلوغ حد إنشاء الصور اليومي لهذا الاتصال. حاول غداً.' : 'وصلت إلى الحد اليومي لإنشاء الصور (5 صور). حاول غداً.';
    return res.status(429).json({ success: false, error: message });
  }

  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
          }
        }),
        signal: AbortSignal.timeout(150000)
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      await refundImageQuota(quota.keys);
      const upstreamMessage = String(payload?.error?.message || '');
      console.error('[Gemini image provider]', response.status, upstreamMessage.slice(0, 300));
      if (response.status === 400 || response.status === 404) {
        return res.status(502).json({ success: false, error: 'تعذر استخدام نموذج Gemini للصور. تحقق من اسم النموذج وإتاحته لمفتاحك.' });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ success: false, error: 'مفتاح Gemini غير صالح أو ليس لديه صلاحية إنشاء الصور. راجع إعداد GEMINI_API_KEY.' });
      }
      if (response.status === 429) {
        return res.status(429).json({ success: false, error: 'وصل Gemini إلى حد الاستخدام أو توجد طلبات كثيرة. حاول لاحقاً.' });
      }
      return res.status(502).json({ success: false, error: 'تعذر إنشاء الصورة عبر Gemini حالياً. حاول بوصف آخر.' });
    }

    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(part => part?.inlineData?.data);
    const image = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType || 'image/png';
    if (typeof image !== 'string' || image.length < 100 || !/^image\//i.test(mimeType)) {
      await refundImageQuota(quota.keys);
      const blocked = payload?.promptFeedback?.blockReason;
      console.error('[Gemini image response]', blocked || 'No image part returned');
      return res.status(502).json({
        success: false,
        error: blocked ? 'Gemini لم يسمح بهذا الوصف. جرّب وصفاً مختلفاً.' : 'Gemini لم يرجع صورة صالحة لهذا الطلب. جرّب وصفاً أكثر تحديداً.'
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      success: true,
      image: 'data:' + mimeType + ';base64,' + image,
      model,
      remaining: Math.max(0, DAILY_IMAGE_LIMIT - quota.count)
    });
  } catch (error) {
    await refundImageQuota(quota.keys);
    console.error('[Gemini image generation]', error.name || 'Error', String(error.message || '').slice(0, 200));
    const timeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({
      success: false,
      error: timeout ? 'استغرق إنشاء الصورة وقتاً طويلاً. حاول مرة أخرى.' : 'تعذر الاتصال بخدمة Gemini لإنشاء الصور.'
    });
  }
}
