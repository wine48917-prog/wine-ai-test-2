import { verifyToken } from '../src/lib/jwt.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';

const STAR_X_URL = 'https://nox.bmg-inc.web.id/api/v1/ai/star-x';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success: false, error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = String(req.headers['x-user-token'] || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const user = verifyToken(token);
  if (!user?.uid) return res.status(401).json({ success: false, error: 'انتهت جلسة الزائر. حدّث الصفحة وحاول مرة أخرى.' });

  if (!process.env.NOX_API_KEY) {
    return res.status(503).json({ success: false, error: 'خدمة توليد الصور غير مفعّلة بعد. أضف NOX_API_KEY في إعدادات Vercel.' });
  }

  if (!(await checkRateLimit('star-x-image:' + user.uid))) {
    return res.status(429).json({ success: false, error: 'طلبات الصور كثيرة. انتظر دقيقة ثم حاول مرة أخرى.' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > 4000) {
    return res.status(400).json({ success: false, error: 'اكتب وصفاً للصورة من 1 إلى 4000 حرف.' });
  }

  try {
    const upstream = await fetch(STAR_X_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.NOX_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'image/*, application/json'
      },
      body: JSON.stringify({ action: 'generate-image', prompt }),
      signal: AbortSignal.timeout(90000)
    });

    if (!upstream.ok) {
      let message = 'فشل مزود Star X في توليد الصورة.';
      try {
        const data = await upstream.json();
        message = data.error || data.message || message;
      } catch {}
      return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502)
        .json({ success: false, error: message });
    }

    const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      let message = 'مزود Star X لم يُرجع ملف صورة صالحاً.';
      try {
        const data = await upstream.json();
        message = data.error || data.message || message;
      } catch {}
      return res.status(502).json({ success: false, error: message });
    }

    const image = Buffer.from(await upstream.arrayBuffer());
    if (!image.length || image.length > MAX_IMAGE_BYTES) {
      return res.status(502).json({ success: false, error: 'حجم الصورة الناتجة غير صالح.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(image.length));
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(image);
  } catch (error) {
    console.error('[star-x-image]', error?.message || error);
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({
      success: false,
      error: timeout ? 'استغرق توليد الصورة وقتاً أطول من المتوقع. حاول مرة أخرى.' : 'تعذر الاتصال بمزود توليد الصور.'
    });
  }
}
