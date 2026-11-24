import crypto from 'node:crypto';
import gemini from './scrap/ai/gemini.js';
import pool from '../../db.js';
import { getAppContext } from './app-context.js';
import { verifyToken } from './jwt.js';
import { checkRateLimit, recordAuthFail, isAuthBlocked } from './rate-limit.js';

const TEXT_TOTAL_LIMIT = 50;
const TEXT_WINDOW_MS = 5 * 60 * 60 * 1000;

// 🚀 إزالة المفتاح السري المكتوب (الأمان)
const LENS_SECRET = process.env.LENS_SECRET;
const LENS_BASE_URL = process.env.LENS_BASE_URL || 'https://lensapp.io/appbackend';
const LENS_TIMEOUT_MS = Number(process.env.LENS_TIMEOUT_MS || 25000);

function getClientId(req) {
  const payload = req._jwtPayload;
  if (payload?.uid) return 'user_' + payload.uid;
  const deviceId = req.headers['x-device-id'];
  if (deviceId) return 'dev_' + deviceId;
  return 'ip_' + (req.ip || 'unknown');
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function authorize(req, res) {
  const expected = process.env.API_KEY || '';

  const authHeader = req.headers.authorization || '';
  const apiToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiOk = Boolean(expected && expected.length >= 24 && safeEqual(apiToken, expected));

  const userTokenHeader = req.headers['x-user-token'] || '';
  const userToken = userTokenHeader.startsWith('Bearer ') ? userTokenHeader.slice(7).trim() : '';
  const jwtPayload = verifyToken(userToken) || verifyToken(apiToken);

  if (!apiOk && !jwtPayload) {
    recordAuthFail(getClientId(req)).catch(() => {});
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }

  req._jwtPayload = jwtPayload;
  return true;
}

async function guard(req, res) {
  const clientId = getClientId(req);
  if (await isAuthBlocked(clientId)) {
    res.status(429).json({ success: false, error: 'تم حظرك مؤقتاً بسبب محاولات فاشلة متكررة' });
    return false;
  }
  if (!(await checkRateLimit(clientId))) {
    res.status(429).json({ success: false, error: 'طلبات كثيرة جداً. يرجى التهدئة.' });
    return false;
  }
  return true;
}

function validate(body) {
  if (!body || typeof body !== 'object') return 'JSON body must be an object.';
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) return 'prompt is required.';
  return null;
}

function buildFinalPrompt(userPrompt, historyText) {
  const context = getAppContext();
  let final = `${context}\n`;
  if (historyText && historyText.trim()) final += `[سجل المحادثة السابقة]:\n${historyText.trim()}\n\n`;
  final += `[سؤال المستخدم الحالي]:\n${userPrompt.trim()}`;
  return final;
}

// 🚀 دالة صارمة جداً لإجبار Gemini على استخدام الوصف فقط
function buildVisionPrompt(userPrompt, imageDescription, historyText) {
  const context = getAppContext();
  let final = `${context}\n`;
  if (historyText && historyText.trim()) final += `[سجل المحادثة السابقة]:\n${historyText.trim()}\n\n`;
  final += `[سؤال المستخدم]:\n${userPrompt.trim()}\n\n`;
  final += `[الوصف الدقيق للصورة (هذا الوصف صحيح 100% ويمثل ما تراه الآن)]:\n${imageDescription.trim()}\n\n`;
  final += `[تعليمات صارمة جداً - اقرأها بعناية]:\n`;
  final += `1. أنت ترى الصورة الآن عبر الوصف السابق فقط.\n`;
  final += `2. أجب على سؤال المستخدم بناءً على هذا الوصف حرفياً.\n`;
  final += `3. يُمنع منعاً باتاً إضافة أي تفاصيل غير موجودة في الوصف (مثل وصفها بأنها سيلفي إذا لم يُذكر، أو إطلاق مجاملات من عندك).\n`;
  final += `4. لا تسرد الوصف كاملاً إلا إذا طلب المستخدم ذلك، بل استخدمه للإجابة على السؤال بدقة.\n`;
  return final;
}

// 🚀 استدعاء نظام الرؤية (lens) — يرجّع وصف الصورة
async function analyzeImage(imageBase64, userPrompt) {
  // 🚀 التحقق من وجود المفتاح قبل الاستخدام
  if (!LENS_SECRET) {
    console.error('[vision] LENS_SECRET is not configured in environment variables.');
    throw new Error('Vision service not configured');
  }

  const device = crypto.randomUUID().toUpperCase();
  const time = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', LENS_SECRET).update(`${time}.${device}`).digest('hex');

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    throw new Error('Invalid image base64');
  }
  if (!buffer.length) throw new Error('Empty image data');

  const formData = new FormData();
  formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'chat.jpg');

  const finalContent = `المستخدم أرفق صورة وطلب: "${userPrompt || 'حلل هذه الصورة'}".\nمهمتك: وصف الصورة بدقة مع التركيز على ما يخدم طلب المستخدم. أجب باللغة العربية فقط.`;

  const messages = [{ role: 'user', content: finalContent }];
  formData.append('lang', 'ar');
  formData.append('messages', JSON.stringify(messages));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LENS_TIMEOUT_MS);

  try {
    const response = await fetch(`${LENS_BASE_URL}/chat.php`, {
      method: 'POST',
      headers: {
        'User-Agent': 'okhttp/4.12.0',
        'X-App-Time': time,
        'X-App-Device': device,
        'X-App-Signature': sig,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Lens HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Lens failed');
    return (data.reply || data.response || data.text || '').trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getUser(req) {
  const payload = req._jwtPayload;
  if (payload?.uid) {
    const [rows] = await pool.query('SELECT * FROM users WHERE uuid = ? LIMIT 1', [payload.uid]);
    return rows[0] || null;
  }
  const deviceId = req.headers['x-device-id'] || 'unknown';
  const [rows] = await pool.query('SELECT * FROM users WHERE device_id = ? LIMIT 1', [deviceId]);
  return rows[0] || null;
}

const guestUsage = new Map();
export async function readQuota(req) {
  if (req._jwtPayload?.guest) { const used = guestUsage.get(req._jwtPayload.uid) || 0; return { remaining: Math.max(0, 50-used), limit: 50, resetAt: 0, uuid: req._jwtPayload.uid, isDev: false }; }
  try {
    const user = await getUser(req);
    if (!user) return { remaining: TEXT_TOTAL_LIMIT, limit: TEXT_TOTAL_LIMIT, resetAt: 0, uuid: null, isDev: false };
    const now = Date.now();
    let usage = Number(user.usage_count || 0);
    let reset = Number(user.reset_time || 0);
    if (reset > 0 && now >= reset) { usage = 0; reset = 0; }
    const isDev = Boolean(user.is_dev);
    return {
      remaining: isDev ? TEXT_TOTAL_LIMIT : Math.max(0, TEXT_TOTAL_LIMIT - usage),
      limit: TEXT_TOTAL_LIMIT,
      resetAt: isDev ? 0 : reset,
      uuid: user.uuid,
      isDev,
    };
  } catch { return null; }
}

async function consumeQuota(req) {
  if (req._jwtPayload?.guest) { const id = req._jwtPayload.uid; const used = guestUsage.get(id) || 0; if (used >= 50) return { ok:false, error:'وصلت للحد التجريبي للزائر (50 رسالة). سجّل حساباً للمتابعة.' }; guestUsage.set(id, used + 1); return { ok:true, remaining:49-used, limit:50, resetAt:0, uuid:id, isDev:false }; }
  const now = Date.now();
  try {
    const user = await getUser(req);
    if (!user) return { ok: false, error: 'الرجاء تسجيل الدخول أولاً' };

    const isDev = Boolean(user.is_dev);
    if (isDev) {
      return { ok: true, remaining: TEXT_TOTAL_LIMIT, limit: TEXT_TOTAL_LIMIT, resetAt: 0, uuid: user.uuid, isDev: true };
    }

    const [upd] = await pool.query(
      `UPDATE users
       SET usage_count = usage_count + 1,
           reset_time = IF(usage_count + 1 >= ? AND reset_time = 0, ?, reset_time)
       WHERE id = ?
         AND (reset_time = 0 OR reset_time > ?)
         AND usage_count < ?`,
      [TEXT_TOTAL_LIMIT, now + TEXT_WINDOW_MS, user.id, now, TEXT_TOTAL_LIMIT]
    );

    if (upd.affectedRows === 0) {
      const [rows] = await pool.query('SELECT usage_count, reset_time FROM users WHERE id = ?', [user.id]);
      const row = rows[0];
      let usage = Number(row?.usage_count || 0);
      let reset = Number(row?.reset_time || 0);
      if (reset > 0 && now >= reset) {
        await pool.query('UPDATE users SET usage_count = 1, reset_time = 0 WHERE id = ?', [user.id]);
        return { ok: true, remaining: TEXT_TOTAL_LIMIT - 1, limit: TEXT_TOTAL_LIMIT, resetAt: 0, uuid: user.uuid, isDev: false };
      }
      return {
        ok: false,
        remaining: Math.max(0, TEXT_TOTAL_LIMIT - usage),
        limit: TEXT_TOTAL_LIMIT,
        resetAt: reset,
        uuid: user.uuid,
        isDev: false,
        error: `لقد استهلكت الحد الأقصى (${TEXT_TOTAL_LIMIT} رسالة).`,
      };
    }

    const [rows] = await pool.query('SELECT usage_count, reset_time FROM users WHERE id = ?', [user.id]);
    const row = rows[0] || { usage_count: 1, reset_time: 0 };
    const newCount = Number(row.usage_count);
    const newReset = Number(row.reset_time);
    return {
      ok: true,
      remaining: Math.max(0, TEXT_TOTAL_LIMIT - newCount),
      limit: TEXT_TOTAL_LIMIT,
      resetAt: newReset,
      uuid: user.uuid,
      isDev: false,
    };
  } catch (err) {
    console.error('[consumeQuota]', err.message);
    return { ok: false, error: 'خطأ في قاعدة البيانات.' };
  }
}

async function refundQuota(req) {
  if (req._jwtPayload?.guest) { const id=req._jwtPayload.uid; guestUsage.set(id, Math.max(0,(guestUsage.get(id)||0)-1)); return; }
  try {
    const user = await getUser(req);
    if (!user) return;
    await pool.query(
      'UPDATE users SET usage_count = GREATEST(0, usage_count - 1), reset_time = IF(GREATEST(0, usage_count - 1) < ?, 0, reset_time) WHERE id = ?',
      [TEXT_TOTAL_LIMIT, user.id]
    );
  } catch {}
}

function hasValidImage(body) {
  return body && body.image && typeof body.image === 'string' && body.image.length > 100;
}

export async function chat(req, res) {
  if (!authorize(req, res)) return;
  if (!(await guard(req, res))) return;
  const issue = validate(req.body);
  if (issue) return res.status(400).json({ success: false, error: issue });

  const quotaState = await consumeQuota(req);
  if (!quotaState.ok) return res.status(429).json({ success: false, error: quotaState.error, quota: quotaState });
  if (quotaState.uuid) res.setHeader('x-user-uuid', quotaState.uuid);

  try {
    let finalPrompt = buildFinalPrompt(req.body.prompt, req.body.history || '');

    if (hasValidImage(req.body)) {
      try {
        const description = await analyzeImage(req.body.image, req.body.prompt);
        if (description) {
          finalPrompt = buildVisionPrompt(req.body.prompt, description, req.body.history || '');
        }
      } catch (e) {
        console.error('[vision] failed:', e.message);
      }
    }

    const result = await gemini.chat({ prompt: finalPrompt, sessionId: req.body.sessionId || null });
    return res.status(200).json({ ...result, quota: quotaState });
  } catch (error) {
    await refundQuota(req);
    return res.status(502).json({
      success: false,
      error: String(error?.message || 'فشل الطلب').slice(0, 700),
      quota: await readQuota(req),
    });
  }
}

export async function streamChat(req, res) {
  if (!authorize(req, res)) return;
  if (!(await guard(req, res))) return;
  const issue = validate(req.body);
  if (issue) return res.status(400).json({ success: false, error: issue });

  const quotaState = await consumeQuota(req);
  if (!quotaState.ok) return res.status(429).json({ success: false, error: quotaState.error, quota: quotaState });
  if (quotaState.uuid) res.setHeader('x-user-uuid', quotaState.uuid);

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;
  req.on('close', () => { closed = true; });

  const send = (event, data) => {
    if (closed || res.destroyed) return;
    try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { closed = true; }
  };

  const heartbeat = setInterval(() => {
    if (closed || res.destroyed) { clearInterval(heartbeat); return; }
    try { res.write(': keep-alive\n\n'); } catch { closed = true; }
  }, 15000);

  let chunksSent = 0;
  try {
    send('status', { status: 'processing' });

    let finalPrompt = buildFinalPrompt(req.body.prompt, req.body.history || '');

    if (hasValidImage(req.body)) {
      send('thinking', { message: 'جاري تحليل الصورة...' });
      try {
        const description = await analyzeImage(req.body.image, req.body.prompt);
        if (description) {
          finalPrompt = buildVisionPrompt(req.body.prompt, description, req.body.history || '');
        }
      } catch (e) {
        console.error('[vision] failed:', e.message);
      }
      send('thinking', { message: 'جاري صياغة الرد...' });
    }

    const params = { ...req.body, prompt: finalPrompt };
    delete params.image;

    const result = await gemini.chatStream(params, (delta) => {
      if (closed || !delta) return;
      chunksSent++;
      send('chunk', { text: delta });
    });
    send('done', { success: true, quota: quotaState, sessionId: result.sessionId || null });
  } catch (error) {
    if (chunksSent === 0) await refundQuota(req);
    send('error', { success: false, error: String(error?.message || 'فشل الطلب').slice(0, 700) });
  } finally {
    clearInterval(heartbeat);
    if (!res.destroyed) res.end();
  }
}
