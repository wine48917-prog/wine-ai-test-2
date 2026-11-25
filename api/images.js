import crypto from 'node:crypto';
import pool, { ensureDatabase } from '../db.js';
import { verifyToken } from '../src/lib/jwt.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };
const DAILY_IMAGE_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const GATEWAY_IMAGE_MODEL = process.env.AI_GATEWAY_IMAGE_MODEL || 'google/gemini-3.1-flash-image';

function getToken(req) {
  const header = String(req.headers['x-user-token'] || req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}
async function incrementImageQuota(key, limit) {
  const now = Date.now(), resetAt = now + WINDOW_MS;
  await pool.query('INSERT INTO rate_limits (rk, cnt, reset_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE cnt = IF(reset_at <= ?, 1, cnt + 1), reset_at = IF(reset_at <= ?, VALUES(reset_at), reset_at)', [key, resetAt, now, now]);
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
  if (!network.ok) { await refundImageQuota(user.key); return { ok: false, reason: 'ip', key: network.key }; }
  return { ok: true, count: user.count, resetAt: user.resetAt, keys: [user.key, network.key] };
}
async function refundImageQuota(keys) {
  for (const key of Array.isArray(keys) ? keys : [keys]) {
    try { await pool.query('UPDATE rate_limits SET cnt = GREATEST(0, cnt - 1) WHERE rk = ?', [key]); } catch {}
  }
}
async function generateWithCloudflare(prompt) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiToken || !accountId) throw new Error('Cloudflare Workers AI is not configured.');
  const model = process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell';
  const response = await fetch('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(accountId) + '/ai/run/' + encodeURIComponent(model), {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, num_steps: 4 }),
    signal: AbortSignal.timeout(150000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const message = payload?.errors?.[0]?.message || 'Cloudflare Workers AI image request failed.';
    const error = new Error(String(message));
    error.status = response.status;
    throw error;
  }
  const image = payload?.result?.image || payload?.result?.images?.[0];
  if (typeof image !== 'string' || image.length < 100) throw new Error('Cloudflare Workers AI returned no valid image.');
  return { image, mimeType: 'image/png', model, provider: 'cloudflare-workers-ai' };
}
async function generateWithGateway(prompt) {
  const { generateText } = await import('ai');
  const result = await generateText({ model: GATEWAY_IMAGE_MODEL, prompt, abortSignal: AbortSignal.timeout(150000) });
  const file = (result.files || []).find(item => item?.mediaType?.startsWith('image/') && item.uint8Array?.byteLength > 100);
  if (!file) throw new Error('AI Gateway returned no image file.');
  return { image: Buffer.from(file.uint8Array).toString('base64'), mimeType: file.mediaType || 'image/png', model: GATEWAY_IMAGE_MODEL, provider: 'vercel-ai-gateway' };
}
async function generateWithGemini(prompt) {
  const apiKey = process.env.WINE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 20) throw new Error('Gemini fallback is not configured.');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '1:1', imageSize: '1K' } } }),
    signal: AbortSignal.timeout(150000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(String(payload?.error?.message || 'Gemini image request failed.')); error.status = response.status; throw error; }
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(part => part?.inlineData?.data);
  const image = imagePart?.inlineData?.data, mimeType = imagePart?.inlineData?.mimeType || 'image/png';
  if (typeof image !== 'string' || image.length < 100 || !/^image\//i.test(mimeType)) throw new Error(payload?.promptFeedback?.blockReason ? 'Gemini blocked this prompt.' : 'Gemini returned no valid image.');
  return { image, mimeType, model, provider: 'gemini-direct' };
}
export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const identity = verifyToken(getToken(req));
  if (!identity?.uid) return res.status(401).json({ success: false, error: 'انتهت الجلسة. حدّث الصفحة وحاول مرة أخرى.' });
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > 1500) return res.status(400).json({ success: false, error: 'اكتب وصفاً للصورة من 1 إلى 1500 حرف.' });
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!(await checkRateLimit('image:user:' + identity.uid)) || !(await checkRateLimit('image:ip:' + ip))) return res.status(429).json({ success: false, error: 'طلبات إنشاء الصور كثيرة. حاول بعد دقيقة.' });
  let quota;
  try { quota = await consumeImageQuota(identity.uid, ip); }
  catch (error) { console.error('[image quota]', error.message); return res.status(503).json({ success: false, error: 'تعذر التحقق من حد إنشاء الصور حالياً.' }); }
  if (!quota.ok) {
    const message = quota.reason === 'ip' ? 'تم بلوغ حد إنشاء الصور اليومي لهذا الاتصال. حاول غداً.' : 'وصلت إلى الحد اليومي لإنشاء الصور (5 صور). حاول غداً.';
    return res.status(429).json({ success: false, error: message });
  }
  let generated, cloudflareError, gatewayError;
  try { generated = await generateWithCloudflare(prompt); }
  catch (error) { cloudflareError = error; console.error('[Cloudflare Workers AI image provider]', error.status || error.name || 'Error', String(error.message || '').slice(0, 240)); }
  if (!generated) {
    try { generated = await generateWithGateway(prompt); }
    catch (error) { gatewayError = error; console.error('[AI Gateway image provider]', error.statusCode || error.status || error.name || 'Error', String(error.message || '').slice(0, 240)); }
  }
  if (!generated) {
    try { generated = await generateWithGemini(prompt); }
    catch (fallbackError) {
      await refundImageQuota(quota.keys);
      console.error('[Gemini image fallback]', fallbackError.status || fallbackError.name || 'Error', String(fallbackError.message || '').slice(0, 240));
      if (fallbackError.status === 429) return res.status(503).json({ success: false, error: 'حصة Gemini الحالية مستنفدة (429). انتظر إعادة ضبط الحصة المجانية أو استخدم مفتاحاً من مشروع Google لديه حصة متاحة.' });
      if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) return res.status(503).json({ success: false, error: 'Gemini غير متاح حالياً، ومزوّد Cloudflare الاحتياطي غير مُعد في Vercel.' });
      const gatewayStatus = Number(gatewayError?.statusCode || gatewayError?.status || 0);
      if (gatewayStatus === 401 || gatewayStatus === 403) return res.status(503).json({ success: false, error: 'تعذّر الاتصال بمزوّد الصور الاحتياطي في Vercel.' });
      if (gatewayStatus === 402 || /credit|budget|payment/i.test(String(gatewayError?.message || ''))) return res.status(503).json({ success: false, error: 'رصيد مزوّد الصور الاحتياطي في Vercel غير كافٍ.' });
      return res.status(502).json({ success: false, error: 'تعذر إنشاء الصورة حالياً. حاول لاحقاً.' });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ success: true, image: 'data:' + generated.mimeType + ';base64,' + generated.image, model: generated.model, provider: generated.provider, remaining: Math.max(0, DAILY_IMAGE_LIMIT - quota.count) });
}
