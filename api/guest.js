import crypto from 'node:crypto';
import { signToken } from '../src/lib/jwt.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';
export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success:false, error:'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!(await checkRateLimit('guest:' + clientIp))) return res.status(429).json({ success:false, error:'طلبات إنشاء الزوار كثيرة. حاول بعد دقيقة.' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ success:false, error:'JWT_SECRET غير مضبوط في إعدادات السيرفر' });
  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
  if (rawName.length < 2 || rawName.length > 30) return res.status(400).json({ success:false, error:'الاسم يجب أن يكون من حرفين إلى 30 حرفاً' });
  const uid = 'guest_' + crypto.randomUUID();
  return res.status(200).json({ success:true, token:signToken({ uid, guest:true, name:rawName }, 7), uuid:uid, guest:true, name:rawName });
}
