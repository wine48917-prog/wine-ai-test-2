import { verifyToken } from '../src/lib/jwt.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';

const STAR_X_URL = 'https://nox.bmg-inc.web.id/api/v1/ai/star-x';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

function findImagePayload(value, depth = 0) {
  if (depth > 5 || value == null) return null;
  if (typeof value === 'string') {
    const s = value.trim();
    const dataUrl = s.match(/^data:(image\/[\w.+-]+);base64,(.+)$/is);
    if (dataUrl) return { base64: dataUrl[2], contentType: dataUrl[1].toLowerCase() };
    if (/^https?:\/\//i.test(s)) return { url: s };
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(s) && s.length > 256) return { base64: s, contentType: 'image/png' };
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) { const found = findImagePayload(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof value === 'object') {
    const mime = String(value.mimeType || value.mime_type || value.contentType || value.content_type || 'image/png').toLowerCase();
    for (const key of ['image_url','imageUrl','url','image','b64_json','base64','data','output','result','images','artifacts']) {
      if (value[key] !== undefined) {
        const found = findImagePayload(value[key], depth + 1);
        if (found) { if (found.base64 && /^image\//.test(mime)) found.contentType = mime; return found; }
      }
    }
  }
  return null;
}

async function readImageResponse(response) {
  const type = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type.startsWith('image/')) return { bytes: Buffer.from(await response.arrayBuffer()), contentType: type };
  let payload;
  try { payload = await response.json(); } catch { throw new Error('استجابة مزود الصور غير مفهومة.'); }
  if (payload?.success === false || payload?.ok === false || payload?.error) {
    throw new Error(payload.error?.message || payload.error || payload.message || 'مزود الصور رفض الطلب.');
  }
  const image = findImagePayload(payload);
  if (!image) throw new Error(payload?.message || 'المزود لم يُرجع صورة أو رابط صورة صالحاً.');
  if (image.url) {
    const remote = await fetch(image.url, { signal: AbortSignal.timeout(60000), headers: { Accept: 'image/*' } });
    if (!remote.ok) throw new Error('تعذر تحميل الصورة من رابط المزود.');
    const remoteType = (remote.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!remoteType.startsWith('image/')) throw new Error('الرابط الذي أرجعه المزود لا يحتوي على صورة.');
    return { bytes: Buffer.from(await remote.arrayBuffer()), contentType: remoteType };
  }
  return { bytes: Buffer.from(image.base64.replace(/\s/g, ''), 'base64'), contentType: image.contentType || 'image/png' };
}

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = String(req.headers['x-user-token'] || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const user = verifyToken(token);
  if (!user?.uid) return res.status(401).json({ success: false, error: 'انتهت جلسة الزائر. حدّث الصفحة وحاول مرة أخرى.' });
  if (!process.env.NOX_API_KEY) return res.status(503).json({ success: false, error: 'خدمة توليد الصور غير مفعّلة. تحقق من NOX_API_KEY في Vercel.' });

  if (!(await checkRateLimit('star-x-image:' + user.uid))) {
    return res.status(429).json({ success: false, error: 'طلبات الصور كثيرة أو خدمة الحماية غير متاحة. حاول بعد دقيقة.' });
  }
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > 4000) return res.status(400).json({ success: false, error: 'اكتب وصفاً للصورة من 1 إلى 4000 حرف.' });

  try {
    const upstream = await fetch(STAR_X_URL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.NOX_API_KEY, 'Content-Type': 'application/json', Accept: 'image/*, application/json' },
      body: JSON.stringify({ action: 'generate-image', prompt }),
      signal: AbortSignal.timeout(120000)
    });
    if (!upstream.ok) {
      let message = 'فشل مزود Star X في توليد الصورة.';
      try { const data = await upstream.json(); message = data.error?.message || data.error || data.message || message; } catch {}
      return res.status(502).json({ success: false, error: String(message).slice(0, 500) });
    }
    const result = await readImageResponse(upstream);
    if (!result.bytes?.length || result.bytes.length > MAX_IMAGE_BYTES) {
      return res.status(502).json({ success: false, error: 'حجم الصورة الناتجة غير صالح أو أكبر من 15 ميجابايت.' });
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', String(result.bytes.length));
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(result.bytes);
  } catch (error) {
    console.error('[star-x-image]', error?.message || error);
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({
      success: false,
      error: timeout ? 'استغرق توليد الصورة وقتاً أطول من المتوقع. حاول مرة أخرى.' : (error?.message || 'تعذر الاتصال بمزود توليد الصور.')
    });
  }
}