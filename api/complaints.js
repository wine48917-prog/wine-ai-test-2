import pool, { ensureDatabase } from '../db.js';
import { hasOwnerSession } from '../src/lib/owner-auth.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';

const PAGE = \`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#09090c"><title>إرسال مشكلة — WINE AI</title><link rel="icon" href="/icon.png"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:24px;background:radial-gradient(ellipse at 80% 0,#57182c55,transparent 38%),#09090c;color:#f4edf1;font-family:Cairo,Arial,sans-serif;display:grid;place-items:center}main{width:min(620px,100%);padding:clamp(22px,5vw,38px);border:1px solid #503044;border-radius:24px;background:linear-gradient(145deg,#19121a,#100d12);box-shadow:0 24px 80px #0008}.brand{font:900 13px Manrope;letter-spacing:3px;color:#d86a89}.eyebrow{margin-top:28px;color:#c04a68;font:800 10px Manrope;letter-spacing:3px}h1{font-size:clamp(25px,6vw,36px);margin:8px 0}.intro{font-size:12px;color:#b6aab2;line-height:2;margin:0 0 22px}label{display:block;font-size:12px;font-weight:800;color:#d9cbd4;margin:16px 0 8px}select,textarea{width:100%;margin-top:8px;border:1px solid #4a3341;border-radius:13px;background:#0b090d;color:#fff;padding:13px;font:inherit;outline:none}textarea{min-height:180px;resize:vertical;line-height:1.9}select:focus,textarea:focus{border-color:#bd4565;box-shadow:0 0 0 3px #a52b4822}button{width:100%;border:0;border-radius:13px;padding:14px;margin-top:18px;background:linear-gradient(120deg,#b83d5d,#701a35);color:#fff;font:800 13px Cairo;cursor:pointer}button:disabled{opacity:.6;cursor:wait}#state{min-height:24px;margin-top:14px;font-size:12px;line-height:1.8;color:#d98ca2}.back{display:inline-block;margin-top:20px;color:#c9879b;font-size:11px;text-decoration:none}.note{color:#8e828c;font-size:10px;line-height:1.9;margin-top:12px}
</style></head><body><main><div class="brand">WINE AI</div><div class="eyebrow">USER FEEDBACK</div><h1>واجهت مشكلة؟</h1><p class="intro">رأيك يساعدنا نطوّر WINE AI. اكتب المشكلة بالتفصيل، وفريق التطوير هيقدر يراجعها من لوحة OWENR.</p>
<form id="complaintForm"><label for="category">نوع المشكلة</label><select id="category" required><option value="مشكلة في الواجهة">مشكلة في الواجهة</option><option value="مشكلة في WINE AI">مشكلة في WINE AI</option><option value="مشكلة في WINE STUDIO">مشكلة في WINE STUDIO</option><option value="مشكلة في الدخول">مشكلة في الدخول</option><option value="اقتراح أو شيء آخر">اقتراح أو شيء آخر</option></select><label for="message">اشرح المشكلة</label><textarea id="message" minlength="10" maxlength="2000" placeholder="اكتب إيه اللي حصل، والخطوات اللي عملتها قبل ظهور المشكلة..." required></textarea><div class="note">لا تكتب كلمات مرور أو بيانات شخصية حساسة. الشكوى ستظهر لفريق WINE داخل لوحة OWENR.</div><button id="sendBtn" type="submit">إرسال الشكوى</button><div id="state" role="status" aria-live="polite"></div></form><a class="back" href="/">← العودة إلى WINE AI</a></main>
<script>
const form=document.getElementById('complaintForm'),button=document.getElementById('sendBtn'),state=document.getElementById('state');
form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;state.textContent='جارٍ إرسال الشكوى…';try{const response=await fetch('/api/complaints',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:document.getElementById('category').value,message:document.getElementById('message').value.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||'تعذر إرسال الشكوى. حاول مرة أخرى.');form.reset();state.textContent='وصلت شكواك بنجاح. شكراً لمساعدتنا في تحسين WINE AI.';state.style.color='#75d39a'}catch(error){state.textContent=error.message;state.style.color='#ff8a9f'}finally{button.disabled=false}});
</script></body></html>\`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    if (String(req.query?.admin || '') === '1') {
      if (!hasOwnerSession(req)) return res.status(401).json({ success: false, error: 'يجب تسجيل دخول المطوّر أولاً.' });
      try {
        await ensureDatabase();
        const [rows] = await pool.query('SELECT id, category, message, created_at FROM complaints ORDER BY created_at DESC LIMIT 200');
        return res.status(200).json({ success: true, complaints: rows });
      } catch (error) {
        console.error('[complaints list]', error.message);
        return res.status(503).json({ success: false, error: 'تعذر تحميل الشكاوى من قاعدة البيانات.' });
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(PAGE);
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!(await checkRateLimit('wine-complaint:' + ip))) return res.status(429).json({ success: false, error: 'طلبات كثيرة. انتظر دقيقة ثم حاول مجدداً.' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 40) : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const allowed = ['مشكلة في الواجهة', 'مشكلة في WINE AI', 'مشكلة في WINE STUDIO', 'مشكلة في الدخول', 'اقتراح أو شيء آخر'];
  if (!allowed.includes(category)) return res.status(400).json({ success: false, error: 'اختار نوع المشكلة.' });
  if (message.length < 10 || message.length > 2000) return res.status(400).json({ success: false, error: 'اكتب وصفاً من 10 إلى 2000 حرف.' });
  try {
    await ensureDatabase();
    await pool.execute('INSERT INTO complaints (category, message) VALUES (?, ?)', [category, message]);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('[complaints submit]', error.message);
    return res.status(503).json({ success: false, error: 'تعذر حفظ الشكوى حالياً. حاول لاحقاً.' });
  }
}
