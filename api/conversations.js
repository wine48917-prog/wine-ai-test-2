import { maintenanceGuard } from '../src/lib/site-control.js';
import { verifyToken } from '../src/lib/jwt.js';
import { applyCORS, isOriginAllowed } from '../src/lib/cors.js';
import pool, { ensureDatabase } from '../db.js';

function getPayload(req) {
  const raw = String(req.headers['x-user-token'] || req.headers.authorization || '');
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
  return verifyToken(token);
}

function fail(res, status, error) {
  return res.status(status).json({ success: false, error });
}

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (await maintenanceGuard(req, res)) return;
  if (!isOriginAllowed(req)) return fail(res, 403, 'Origin not allowed');

  const payload = getPayload(req);
  if (!payload?.uid || payload.guest) return fail(res, 401, 'سجّل الدخول بحسابك للوصول إلى محادثاتك المحفوظة.');

  try {
    await ensureDatabase();
    const [users] = await pool.query('SELECT uuid, email, created_at, usage_count, reset_time FROM users WHERE uuid = ? LIMIT 1', [payload.uid]);
    const user = users[0];
    if (!user) return fail(res, 401, 'الحساب غير موجود أو انتهت صلاحيته.');

    if (req.method === 'GET') {
      const id = typeof req.query?.id === 'string' ? req.query.id : '';
      if (id) {
        const [rows] = await pool.query(
          'SELECT conversation_id, title, session_id, messages_json, created_at, updated_at FROM user_conversations WHERE user_uuid = ? AND conversation_id = ? LIMIT 1',
          [user.uuid, id]
        );
        if (!rows[0]) return fail(res, 404, 'المحادثة غير موجودة.');
        let messages = [];
        try { messages = JSON.parse(rows[0].messages_json || '[]'); } catch {}
        return res.status(200).json({ success: true, conversation: {
          id: rows[0].conversation_id, title: rows[0].title,
          sessionId: rows[0].session_id, messages,
          createdAt: rows[0].created_at, updatedAt: rows[0].updated_at
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

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : 'محادثة جديدة';
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 16000) : null;
      const messages = body.messages;
      if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return fail(res, 400, 'معرّف المحادثة غير صالح.');
      if (!Array.isArray(messages) || messages.length > 100) return fail(res, 400, 'صيغة سجل المحادثة غير صالحة.');
      const safeMessages = [];
      let total = 0;
      for (const item of messages) {
        if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') return fail(res, 400, 'توجد رسالة غير صالحة في المحادثة.');
        total += item.text.length;
        if (item.text.length > 30000 || total > 250000) return fail(res, 413, 'حجم المحادثة أكبر من الحد المسموح.');
        safeMessages.push({ role: item.role, text: item.text });
      }
      const json = JSON.stringify(safeMessages);
      await pool.query(
        `INSERT INTO user_conversations (user_uuid, conversation_id, title, session_id, messages_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), session_id = VALUES(session_id), messages_json = VALUES(messages_json), updated_at = CURRENT_TIMESTAMP`,
        [user.uuid, id, title || 'محادثة جديدة', sessionId, json]
      );
      return res.status(200).json({ success: true, saved: true, id });
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query?.id === 'string' ? req.query.id.trim() : '';
      if (!id) return fail(res, 400, 'معرّف المحادثة مطلوب.');
      const [result] = await pool.query('DELETE FROM user_conversations WHERE user_uuid = ? AND conversation_id = ?', [user.uuid, id]);
      return res.status(200).json({ success: true, deleted: result.affectedRows > 0 });
    }

    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return fail(res, 405, 'Method not allowed');
  } catch (error) {
    console.error('[conversations]', error?.message || error);
    return fail(res, 503, 'تعذر الوصول إلى بيانات الحساب حالياً.');
  }
}
