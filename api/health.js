import { ensureDatabase } from '../db.js';
import gemini from '../src/lib/scrap/ai/gemini.js';
import { hasOwnerSession } from '../src/lib/owner-auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (!hasOwnerSession(req)) {
    return res.status(401).json({ success: false, error: 'يجب تسجيل دخول المطوّر أولاً.' });
  }

  const timestamp = new Date().toISOString();
  const checks = await Promise.allSettled([
    ensureDatabase(),
    Promise.race([
      (async () => {
        const startedAt = Date.now();
        const result = await gemini.chat({ prompt: 'Reply with exactly: OK' });
        const response = String(result?.response || '').trim();
        if (!result?.success || !response) throw new Error('لم يصل رد صالح من محرك الذكاء الاصطناعي.');
        return { status: 'online', latencyMs: Date.now() - startedAt };
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت مهلة اختبار محرك الذكاء (8 ثوانٍ).')), 8000))
    ])
  ]);

  const database = checks[0].status === 'fulfilled' ? 'connected' : 'disconnected';
  const ai = checks[1].status === 'fulfilled'
    ? checks[1].value
    : { status: 'offline', error: String(checks[1].reason?.message || 'فشل اختبار محرك الذكاء').slice(0, 180) };

  if (database === 'disconnected') console.error('[health database]', checks[0].reason?.message);
  if (ai.status === 'offline') console.warn('[health ai probe]', ai.error);

  return res.status(200).json({
    success: ai.status === 'online' && database === 'connected',
    service: 'WINE AI',
    ai,
    database,
    features: {
      chat: ai.status === 'online',
      imageGeneration: Boolean(process.env.NOX_API_KEY)
    },
    timestamp
  });
}
