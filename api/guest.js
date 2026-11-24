import crypto from 'node:crypto';
import { signToken } from '../src/lib/jwt.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';
export default function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isOriginAllowed(req)) return res.status(403).json({ success:false, error:'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ success:false, error:'JWT_SECRET غير مضبوط في إعدادات السيرفر' });
  const uid = 'guest_' + crypto.randomUUID();
  return res.status(200).json({ success:true, token:signToken({ uid, guest:true }, 7), uuid:uid, guest:true });
}
