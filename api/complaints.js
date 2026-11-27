import pool, { ensureDatabase } from '../db.js';
import { hasOwnerSession } from '../src/lib/owner-auth.js';
import { checkRateLimit } from '../src/lib/rate-limit.js';

const PAGE = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#09090c"><title>إرسال مشكلة — WINE AI</title><link rel="icon" href="/icon.png"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:24px;background:radial-gradient(ellipse at 80% 0,#57182c55,transparent 38%),#09090c;color:#f4edf1;font-family:Cairo,Arial,sans-serif;display:grid;place-items:center}main{width:min(620px,100%);padding:clamp(22px,5vw,38px);border:1px solid #503044;border-radius:24px;background:linear-gradient(145deg,#19121a,#100d12);box-shadow:0 24px 80px #0008}.brand{font:900 13px Manrope;letter-spacing:3px;color:#d86a89}.eyebrow{margin-top:28px;color:#c04a68;font:800 10px Manrope;letter-spacing:3px}h1{font-size:clamp(25px,6vw,36px);margin:8px 0}.intro{font-size:12px;color:#b6aab2;line-height:2;margin:0 0 22px}label{display:block;font-size:12px;font-weight:800;color:#d9cbd4;margin:16px 0 8px}select,textarea{width:100%;margin-top:8px;border:1px solid #4a3341;border-radius:13px;background:#0b090d;color:#fff;padding:13px;font:inherit;outline:none}textarea{min-height:180px;resize:vertical;line-height:1.9}select:focus,textarea:focus{border-color:#bd4565;box-shadow:0 0 0 3px #a52b4822}button{width:100%;border:0;border-radius:13px;padding:14px;margin-top:18px;background:linear-gradient(120deg,#b83d5d,#701a35);color:#fff;font:800 13px Cairo;cursor:pointer}button:disabled{opacity:.6;cursor:wait}#state{min-height:24px;margin-top:14px;font-size:12px;line-height:1.8;color:#d98ca2}.back{display:inline-block;margin-top:20px;color:#c9879b;font-size:11px;text-decoration:none}.note{color:#8e828c;font-size:10px;line-height:1.9;margin-top:12px}

/* WINE unified visual identity · deep emerald / jade / warm silver */
:root{color-scheme:dark;--bg:#081310;--panel:#101e1a;--panel2:#162923;--line:#29483e;--text:#edf5f1;--muted:#a0b5ab;--silver:#dce9e2;--wine:#16866e;--wine2:#45b99a;--rose:#8bd7bd;--pink:#8bd7bd}
html{background:#081310}
body{background-color:#081310!important;color:#edf5f1}
a{transition:color .2s,border-color .2s,background .2s}
button,input,textarea,select{accent-color:#45b99a}
::selection{background:#287e68;color:#f4fff9}

body{background:radial-gradient(ellipse at 80% 0%,#1b8b6a35,transparent 38%),#081310!important;color:#edf5f1}
main{border-color:#31584a!important;background:linear-gradient(145deg,#14251f,#0d1915)!important}
.brand,.eyebrow{color:#73d0b2!important}
label{color:#d5e8df!important}
select,textarea,input{background:#091712!important;border-color:#31584a!important;color:#f2faf6!important}
select:focus,textarea:focus,input:focus{border-color:#45b99a!important;box-shadow:0 0 0 3px #45b99a22!important}
button{background:linear-gradient(120deg,#1a745d,#35a987)!important;color:#f4fff9!important}


/* WINE AI · warm white / graphite / emerald identity */
:root{color-scheme:light;--bg:#F9F8F5;--panel:#fff;--panel2:#f0f1ed;--line:#dfe4df;--text:#121313;--muted:#626b66;--silver:#e7ebe6;--wine:#16866e;--wine2:#28a486;--rose:#16866e;--pink:#16866e;--accent:#16866e}
html{background:#F9F8F5!important;color-scheme:light}
body{background:#F9F8F5!important;color:#121313!important}
body:before{opacity:.18}
header,footer,.top,.sidebar{border-color:#dfe4df!important}
.brand-name,.brand strong,.brand-caption,.nav a,.hero h1,.hero h2,h1,h2,h3,h4,.section-title h2,.card h3,.panel-head h2,.entry-title{color:#121313}
.brand-name i,.brand strong i,.eyebrow,.section-title small,.hero h1 span,.hero h2 span,.hero-accent,.section-tag{color:#16866e!important}
.brand-caption,.brand small,.muted,.hero-copy>p,.hero p,.card p,.desc,.section-title p,.footer-copy,.footer-copy,.hint,.note,.intro{color:#626b66!important}
.brand-mark,.mark,.core,.modal-logo{background:linear-gradient(145deg,#fff,#dce5df 55%,#16866e)!important;color:#121313!important;border-color:#16866e!important;box-shadow:0 8px 24px #16866e20!important}
.eyebrow,.hero .hint{background:#e9f4ef!important;border-color:#b9d9ca!important;color:#14745e!important}
.eyebrow:before,.composer-mode i,.dot{background:#16866e!important;box-shadow:0 0 0 4px #16866e1c!important}
button,.btn,.cta,.primary,.submit,.primary-btn,.send-btn,.action.primary,.image-btn{background:linear-gradient(120deg,#16866e,#28a486)!important;color:#fff!important;border:1px solid #16866e!important}
button:hover,.btn:hover,.action:hover{filter:brightness(1.05)}
.action.secondary,.btn.secondary,.secondary,.header-actions a,.header-actions button,.quick-nav a{background:#fff!important;color:#121313!important;border:1px solid #d5ddd7!important}
.card,.feature-card,.panel,.block,.entry-link,.metric,.complaint-card,.gallery-card,.list-item,.owner-locked-link,.tool-card,.category,.sidebar,.login,.modal,.composer,.welcome-card{background:#fff!important;color:#121313!important;border:1px solid #dfe4df!important;box-shadow:0 8px 28px #14251a0a!important}
.card:nth-child(3n),.metric:nth-child(3n){background:#121313!important;color:#fff!important;border-color:#121313!important}
.card:nth-child(3n) h3,.card:nth-child(3n) p,.metric:nth-child(3n) strong,.metric:nth-child(3n) small{color:#fff!important}
input,textarea,select,.field input,.field textarea,.output,.tool-output{background:#fff!important;color:#121313!important;border:1px solid #cfd8d1!important}
input::placeholder,textarea::placeholder{color:#89928c!important}
input:focus,textarea:focus,select:focus{border-color:#16866e!important;box-shadow:0 0 0 3px #16866e20!important}
.nav a,.nav button{color:#343b37!important}.nav a:hover,.nav a.active,.nav button:hover,.nav button.active{background:#e9f4ef!important;border-color:#b9d9ca!important;color:#126b56!important}
.entry-link:hover,.card:hover,.tool-card:hover,.category.active{border-color:#16866e!important}
.halo{border-color:#16866e66!important;box-shadow:0 0 0 18px #16866e0c,0 0 0 38px #16866e08,0 0 60px #16866e22!important}
.halo:before,.halo:after{border-color:#16866e55!important}
.float-tag{background:#fff!important;color:#121313!important;border-color:#dfe4df!important}
#siteNotice{background:#edf6f0!important;color:#121313!important;border-color:#b9d9ca!important}
.sidebar .nav button.active{background:#e9f4ef!important;color:#126b56!important}
.pill{background:#e9f4ef!important;color:#126b56!important;border-color:#b9d9ca!important}
::selection{background:#16866e;color:#fff}


/* WINE AI — Navy Blue & Beige identity */
:root{
 color-scheme:dark;
 --bg:#202943;--panel:#293550;--panel2:#34415d;--line:#48536b;
 --text:#eee2cf;--muted:#c7bcae;--silver:#e8dcc9;
 --wine:#d9c6a8;--wine2:#eee2cf;--rose:#d9c6a8;--pink:#d9c6a8;--accent:#d9c6a8;
}
html{background:#202943!important;color-scheme:dark}
body{background:#202943!important;color:#eee2cf!important}
body:before{opacity:.12}
header,footer,.top,.sidebar{border-color:#48536b!important}
.brand-name,.brand strong,.brand-caption,.nav a,.hero h1,.hero h2,h1,h2,h3,h4,
.section-title h2,.card h3,.panel-head h2,.entry-title{color:#eee2cf}
.brand-name i,.brand strong i,.eyebrow,.section-title small,.hero h1 span,.hero h2 span,
.hero-accent,.section-tag{color:#d9c6a8!important}
.brand-caption,.brand small,.muted,.hero-copy>p,.hero p,.card p,.desc,.section-title p,
.footer-copy,.hint,.note,.intro{color:#c7bcae!important}
.brand-mark,.mark,.core,.modal-logo{
 background:linear-gradient(145deg,#f2e8d9,#d9c6a8 55%,#8d806e)!important;
 color:#202943!important;border-color:#d9c6a8!important;box-shadow:0 8px 24px #080d1a55!important
}
.eyebrow,.hero .hint{background:#34415d!important;border-color:#8d806e!important;color:#eee2cf!important}
.eyebrow:before,.composer-mode i,.dot{background:#d9c6a8!important;box-shadow:0 0 0 4px #d9c6a822!important}
button,.btn,.cta,.primary,.submit,.primary-btn,.send-btn,.action.primary,.image-btn,.generate{
 background:linear-gradient(120deg,#d9c6a8,#bca98d)!important;color:#202943!important;border:1px solid #e8dcc9!important
}
button:hover,.btn:hover,.action:hover{filter:brightness(1.07)}
.action.secondary,.btn.secondary,.secondary,.header-actions a,.header-actions button,.quick-nav a{
 background:#293550!important;color:#eee2cf!important;border:1px solid #59647a!important
}
.card,.feature-card,.panel,.block,.entry-link,.metric,.complaint-card,.gallery-card,.list-item,
.owner-locked-link,.tool-card,.category,.sidebar,.login,.modal,.composer,.welcome-card{
 background:#293550!important;color:#eee2cf!important;border:1px solid #48536b!important;
 box-shadow:0 8px 28px #080d1a30!important
}
.card:nth-child(3n),.metric:nth-child(3n){background:#121a2b!important;color:#eee2cf!important;border-color:#48536b!important}
.card:nth-child(3n) h3,.card:nth-child(3n) p,.metric:nth-child(3n) strong,.metric:nth-child(3n) small{color:#eee2cf!important}
input,textarea,select,.field input,.field textarea,.output,.tool-output{
 background:#202943!important;color:#eee2cf!important;border:1px solid #59647a!important
}
input::placeholder,textarea::placeholder{color:#a9a99f!important}
input:focus,textarea:focus,select:focus{border-color:#d9c6a8!important;box-shadow:0 0 0 3px #d9c6a822!important}
.nav a,.nav button{color:#eee2cf!important}
.nav a:hover,.nav a.active,.nav button:hover,.nav button.active{background:#3a4560!important;border-color:#d9c6a8!important;color:#fff1dc!important}
.entry-link:hover,.card:hover,.tool-card:hover,.category.active{border-color:#d9c6a8!important}
.halo{border-color:#d9c6a866!important;box-shadow:0 0 0 18px #d9c6a80c,0 0 0 38px #d9c6a808,0 0 60px #d9c6a822!important}
.halo:before,.halo:after{border-color:#d9c6a855!important}
.float-tag{background:#293550!important;color:#eee2cf!important;border-color:#48536b!important}
#siteNotice{background:#34415d!important;color:#eee2cf!important;border-color:#d9c6a8!important}
.sidebar .nav button.active,.pill{background:#3a4560!important;color:#fff1dc!important;border-color:#d9c6a8!important}
::selection{background:#d9c6a8;color:#202943}

</style></head><body><main><div class="brand">WINE AI</div><div class="eyebrow">USER FEEDBACK</div><h1>واجهت مشكلة؟</h1><p class="intro">رأيك يساعدنا نطوّر WINE AI. اكتب المشكلة بالتفصيل، وفريق التطوير هيقدر يراجعها من لوحة OWENR.</p>
<form id="complaintForm"><label for="category">نوع المشكلة</label><select id="category" required><option value="مشكلة في الواجهة">مشكلة في الواجهة</option><option value="مشكلة في WINE AI">مشكلة في WINE AI</option><option value="مشكلة في WINE STUDIO">مشكلة في WINE STUDIO</option><option value="مشكلة في الدخول">مشكلة في الدخول</option><option value="اقتراح أو شيء آخر">اقتراح أو شيء آخر</option></select><label for="message">اشرح المشكلة</label><textarea id="message" minlength="10" maxlength="2000" placeholder="اكتب إيه اللي حصل، والخطوات اللي عملتها قبل ظهور المشكلة..." required></textarea><div class="note">لا تكتب كلمات مرور أو بيانات شخصية حساسة. الشكوى ستظهر لفريق WINE داخل لوحة OWENR.</div><button id="sendBtn" type="submit">إرسال الشكوى</button><div id="state" role="status" aria-live="polite"></div></form><a class="back" href="/">← العودة إلى WINE AI</a></main>
<script>
const form=document.getElementById('complaintForm'),button=document.getElementById('sendBtn'),state=document.getElementById('state');
form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;state.textContent='جارٍ إرسال الشكوى…';try{const response=await fetch('/api/complaints',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:document.getElementById('category').value,message:document.getElementById('message').value.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||'تعذر إرسال الشكوى. حاول مرة أخرى.');form.reset();state.textContent='وصلت شكواك بنجاح. شكراً لمساعدتنا في تحسين WINE AI.';state.style.color='#75d39a'}catch(error){state.textContent=error.message;state.style.color='#ff8a9f'}finally{button.disabled=false}});
</script></body></html>`;

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
