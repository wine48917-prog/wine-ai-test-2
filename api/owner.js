import crypto from 'node:crypto';

export const APP_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#080b0f"><meta name="description" content="WINE AI — مساحة ذكية للكتابة والبرمجة والتفكير.">
<title>WINE AI — Intelligence Workspace</title><link rel="icon" type="image/png" href="/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="app-shell wine-workspace">
<div class="sidebar-scrim" id="sidebarScrim"></div>
<aside class="sidebar" id="sidebar">
<button class="sidebar-close" id="sidebarClose" aria-label="إغلاق القائمة">×</button>
<a class="brand" href="#home"><span class="brand-mark">W</span><span><b>WINE <i>AI</i></b><small>INTELLIGENCE WORKSPACE</small></span></a>
<div class="side-section-label">مساحة WINE</div>
<button class="new-chat" id="newChat"><span>＋</span> محادثة جديدة</button>
<a class="studio-nav" href="/studio"><span>✧</span> WINE STUDIO</a>
<div class="history-head"><span class="side-label">محادثاتك السابقة</span><span class="history-count" id="historyCount">LOCAL</span></div>
<div class="history" id="history"><div class="history-empty">ابدأ محادثة جديدة وهتلاقيها هنا</div></div>
<div class="sidebar-bottom">
<div class="sidebar-status"><span></span><div><b>WINE CORE</b><small>جاهز لمساعدتك</small></div></div>
<div class="user-box"><div class="avatar" id="avatar">G</div><div class="user-meta"><b id="userLabel">زائر</b><small id="userType">Guest access</small></div><button id="accountBtn" class="account-btn" title="إعدادات الحساب">⚙</button></div>
</div>
</aside>
<main class="main">
<header class="topbar">
<div class="topbar-leading"><button class="mobile-menu" id="mobileMenu" aria-label="القائمة">☰</button><div class="top-brand">WINE <span>AI</span></div><span class="top-divider"></span><span class="top-context" id="activeTitle">محادثة مع WINE</span></div>
<div class="top-actions"><span class="model-chip"><i></i> WINE CORE</span><a class="studio-top-link" href="/studio">✧ Studio</a><button class="top-new-chat" id="newChatTop">＋ <span>محادثة جديدة</span></button></div>
</header>
<section class="workspace" id="workspace">
<div class="welcome" id="welcome">
<div class="welcome-kicker"><span class="kicker-line"></span> مساحتك الذكية، بإمكانيات أوسع <span class="kicker-dot"></span></div>
<div class="welcome-emblem"><div class="emblem-ring ring-one"></div><div class="emblem-ring ring-two"></div><div class="emblem-core"><span>W</span><i></i></div></div>
<h1>حوّل أفكارك إلى <em>إنجازات</em></h1>
<p class="welcome-description">من أول فكرة لحدّ النتيجة — اكتب، برمج، حلّل واطوّر مشاريعك مع مساعد ذكي يفهم احتياجك.</p>
<div class="prompt-section"><div class="prompt-section-heading"><b>إيه اللي حابب تنجزه؟</b><span>اختار نقطة بداية أو اكتب طلبك مباشرة</span></div>
<div class="quick-grid">
<button class="quick-card" data-prompt="ساعدني في بناء مشروع ويب كامل باستخدام React، وابدأ بتخطيط الملفات والصفحات."><span class="quick-icon">⌘</span><span class="quick-copy"><b>طوّر مشروعك</b><small>خطّط وابنِ واطلق</small></span><span class="quick-arrow">↗</span></button>
<button class="quick-card" data-prompt="راجع الكود الذي سأرسله، واكتشف الأخطاء وحسّن الأداء واشرح التعديلات."><span class="quick-icon">&lt;/&gt;</span><span class="quick-copy"><b>برمجة أذكى</b><small>اكتب كوداً أفضل وأصلح أخطاءه</small></span><span class="quick-arrow">↗</span></button>
<button class="quick-card" data-prompt="ساعدني في كتابة محتوى احترافي ومنظم، واسألني عن التفاصيل الناقصة عند الحاجة."><span class="quick-icon">✎</span><span class="quick-copy"><b>اكتب باحتراف</b><small>أفكار وصياغة ومراجعة</small></span><span class="quick-arrow">↗</span></button>
<button class="quick-card" data-prompt="حلّل المشكلة التي سأشرحها، وحدد السبب الجذري ثم أعطني خطوات عملية للحل."><span class="quick-icon">⌕</span><span class="quick-copy"><b>حلّل وتوصّل للحل</b><small>حلول عملية بخطوات واضحة</small></span><span class="quick-arrow">↗</span></button>
</div></div>
<div class="welcome-footer"><span class="footer-mark">W</span><span>خصوصيتك أولويتنا</span><i></i><span>ذكاء يساعدك على الإنجاز</span></div>
</div>
<div class="messages" id="messages" aria-live="polite"></div>
</section>
<div class="composer-dock"><div class="composer-wrap"><div class="composer"><div class="composer-topline"><span class="composer-mode"><i></i> رسالة جديدة</span><span class="composer-shortcut">ENTER للإرسال</span></div><textarea id="prompt" rows="1" placeholder="اكتب سؤالك أو صف المهمة اللي عايز تنفذها..." maxlength="12000"></textarea><div class="composer-bottom"><span class="composer-hint">Shift + Enter لسطر جديد</span><div class="composer-actions"><button id="generateImage" class="image-btn" type="button" aria-label="إنشاء صورة"><span>✧</span> صورة</button><button id="send" class="send-btn" aria-label="إرسال الرسالة"><span>↑</span></button></div></div></div><div class="disclaimer"><span>◇</span> قد تحتاج بعض الإجابات إلى مراجعة قبل الاعتماد عليها.</div></div></div>
</main></div>
<div class="modal-backdrop" id="nameModal"><section class="modal name-modal"><div class="modal-logo">W</div><div class="eyebrow">WELCOME TO WINE AI</div><h2>أهلاً بك في WINE AI</h2><p class="modal-sub">عرّفنا باسمك وابدأ استخدام WINE AI مباشرة.</p><form id="nameForm"><label>الاسم<input id="guestName" type="text" placeholder="اسمك" minlength="2" maxlength="30" autocomplete="nickname" required></label><button class="primary-btn" type="submit">ابدأ الآن <span>←</span></button><div class="form-error" id="nameError"></div></form><div class="modal-note">تقدر تعدّل اسمك لاحقاً من إعدادات الحساب.</div></section></div>
<div class="toast" id="toast"></div><script src="/app.js" defer></script>
</body></html>`;

const DASHBOARD_HTML = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#09090c"><title>OWENR — WINE AI</title><link rel="icon" href="/icon.png"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 80% 0,#66182e44,transparent 38%),#09090c;color:#f3edf1;font-family:Cairo,Arial,sans-serif}.wrap{width:min(1120px,100%);margin:auto;padding:24px 22px 50px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #382630;padding-bottom:18px}.brand{display:flex;gap:12px;align-items:center;font:900 17px Manrope;letter-spacing:2px}.mark{width:42px;height:42px;display:grid;place-items:center;background:linear-gradient(145deg,#b43a59,#67172e);border-radius:14px;font-size:22px}.brand small{display:block;color:#a99da6;font:700 9px Manrope;letter-spacing:2px;margin-top:4px}.pill{border:1px solid #553044;border-radius:30px;padding:8px 13px;color:#c04a68;font-size:11px;font-weight:800}.hero{margin:36px 0 24px}.eyebrow{font:800 10px Manrope;letter-spacing:3px;color:#c04a68}.hero h1{font-size:clamp(30px,5vw,48px);margin:9px 0}.hero p{margin:0;color:#aa9fa7;font-size:13px;line-height:2}.panel{background:linear-gradient(145deg,#171118,#100d12);border:1px solid #3e2b37;border-radius:20px;padding:22px;margin-top:16px}.login{width:min(430px,100%);margin:11vh auto}.login h1{font-size:28px;margin:0 0 8px}.login p{color:#aa9fa7;font-size:12px;line-height:1.9}.field{display:block;margin:18px 0 10px;color:#c8bbc4;font-size:12px}.field input,.field textarea{display:block;width:100%;margin-top:8px;padding:13px 14px;border-radius:12px;border:1px solid #4a3341;background:#0b090d;color:#fff;font:14px Cairo;outline:none}.field textarea{min-height:100px;resize:vertical}.field input:focus,.field textarea:focus{border-color:#b33b5a;box-shadow:0 0 0 3px #a52b4822}button{border:0;border-radius:12px;padding:12px 17px;background:linear-gradient(120deg,#b83d5d,#701a35);color:#fff;font:800 12px Cairo;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.wide{width:100%}.error{min-height:22px;color:#ff8a9f;font-size:11px;margin-top:8px}.hidden{display:none!important}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.metric{padding:18px;border:1px solid #3d2a36;border-radius:16px;background:#120e13}.metric small{color:#a99da6;font-size:10px}.metric strong{display:block;font:800 21px Manrope;margin-top:8px}.ok{color:#65c98a}.bad{color:#ff718b}.muted{color:#a99da6}.section-title{font-size:16px;margin:0 0 5px}.section-desc{font-size:11px;color:#a99da6;margin:0 0 14px;line-height:1.8}.row{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap}.switch{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:800}.switch input{width:19px;height:19px;accent-color:#a52b48}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.secondary{background:#211720;border:1px solid #553044;color:#e8dce4}.hint{font-size:10px;color:#938690;line-height:1.8;margin-top:8px}.statusline{display:flex;align-items:center;gap:8px;font-size:11px;color:#c4b8c0}.dot{width:8px;height:8px;border-radius:50%;background:#65c98a;box-shadow:0 0 0 4px #65c98a1c}.dot.bad{background:#ff718b;box-shadow:0 0 0 4px #ff718b1c}.foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:22px;padding-top:16px;border-top:1px solid #382630;color:#847983;font:700 9px Manrope;letter-spacing:1.5px}@media(max-width:700px){.wrap{padding:17px 14px 35px}.grid{grid-template-columns:1fr}.panel{padding:16px}.hero{margin-top:27px}.top .pill{font-size:9px;padding:7px 9px}}
</style></head><body><main class="wrap"><header class="top"><div class="brand"><span class="mark">V</span><span>VELOR <span style="color:#c04a68">DEVELOPER</span><small>WINE AI CONTROL CENTER</small></span></div><span class="pill">OWENR ACCESS</span></header>
<section id="login" class="panel login"><div class="eyebrow">OWENR AUTHENTICATION</div><h1>دخول OWENR</h1><p>لوحة التحكم الخاصة بـ WINE AI. الدخول مخصص للمطوّر فقط.</p><form id="loginForm"><label class="field">كلمة المرور<input id="password" type="password" autocomplete="current-password" placeholder="أدخل كلمة مرور المطوّر" required></label><button class="wide" id="loginBtn">دخول آمن ←</button><div id="loginError" class="error"></div></form></section>
<section id="dashboard" class="hidden"><div class="hero"><div class="eyebrow">SYSTEM OVERVIEW</div><h1>مركز تحكم WINE AI</h1><p>تابع حالة المحرك والخدمات، وانشر رسائل للمستخدمين أو فعّل وضع الصيانة من غير تعديل ملفات الموقع.</p></div>
<div class="grid"><article class="metric"><small>WINE AI CORE / API</small><strong id="coreStatus">جارٍ الفحص…</strong><div class="statusline"><i class="dot" id="coreDot"></i><span id="coreDetail">فحص الاتصال</span></div></article><article class="metric"><small>DATABASE</small><strong id="dbStatus">—</strong><div class="statusline"><i class="dot" id="dbDot"></i><span id="dbDetail">حالة قاعدة البيانات</span></div></article><article class="metric"><small>IMAGE GENERATION</small><strong id="imageStatus">—</strong><div class="statusline"><i class="dot" id="imageDot"></i><span id="imageDetail">إعداد مزود الصور</span></div></article></div>
<div class="panel"><div class="row"><div><h2 class="section-title">إحصائيات الزوار</h2><p class="section-desc">عدد مرات دخول الصفحات الرئيسية، مع تقدير الزوار الفريدين عبر متصفحهم.</p></div><button id="analyticsRefresh" class="secondary">تحديث الإحصائيات</button></div><div class="grid"><article class="metric"><small>إجمالي الزيارات</small><strong id="totalVisits">—</strong></article><article class="metric"><small>زوار مميزون تقريباً</small><strong id="uniqueVisitors">—</strong></article><article class="metric"><small>زيارات اليوم</small><strong id="todayVisits">—</strong></article></div><div class="hint" id="analyticsNote">يتم تحديث الأرقام بعد تسجيل الدخول إلى الصفحات الرئيسية أو المحادثة أو الاستوديو.</div></div>
<div class="panel"><h2 class="section-title">رسالة تظهر للجميع</h2><p class="section-desc">اكتب إعلاناً أو تنبيهاً يظهر في الصفحة الرئيسية لكل الزوار. تقدر تعدله أو تخفيه في أي وقت.</p><label class="field">نص الرسالة<textarea id="notice" maxlength="500" placeholder="مثال: WINE AI تحت التحديث — هنرجع قريباً بأدوات جديدة."></textarea></label><div class="row"><label class="switch"><input id="noticeEnabled" type="checkbox"> نشر الرسالة على الصفحة الرئيسية</label><span class="muted" id="noticeCount">0 / 500</span></div></div>
<div class="panel"><h2 class="section-title">التحكم في إتاحة الموقع</h2><p class="section-desc">عند تفعيل الصيانة، ستتوقف الصفحة الرئيسية والمحادثة والاستوديو وواجهات الاستخدام العامة. لوحة المطوّر ستظل متاحة لك لإعادة فتح الموقع.</p><label class="field">رسالة الصيانة للزوار<textarea id="maintenanceMessage" maxlength="500" placeholder="الموقع متوقف مؤقتاً للصيانة. سنعود قريباً."></textarea></label><label class="switch"><input id="maintenance" type="checkbox"> تفعيل وضع الصيانة وإغلاق الموقع للجميع</label><div class="actions"><button id="saveBtn">حفظ التغييرات</button><button id="refreshBtn" class="secondary">تحديث حالة الذكاء</button><button id="logoutBtn" class="secondary">تسجيل الخروج</button></div><div id="saveState" class="hint">التغييرات تُحفظ مباشرة في قاعدة البيانات وتظهر للزوار بدون تعديل ملفات.</div></div>
<div class="panel"><div class="row"><div><h2 class="section-title">حالة النظام</h2><p class="section-desc">قراءة تشغيلية من واجهة الفحص، وليست عرضاً للتفكير الداخلي أو المحادثات الخاصة.</p></div><span class="muted" id="lastCheck">—</span></div><div class="statusline" id="providerInfo">المزوّد: —</div></div></section><footer class="foot"><span>DEV BY VELOR · BMG</span><span>WINE ORGANIZATION · PRIVATE</span></footer></main>
<script>(function(){const $=id=>document.getElementById(id);let authenticated=false;
async function request(url,options){const r=await fetch(url,Object.assign({credentials:'same-origin',cache:'no-store'},options||{}));let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'تعذر إكمال الطلب');return d}
function showLogin(msg){authenticated=false;$('dashboard').classList.add('hidden');$('login').classList.remove('hidden');if(msg)$('loginError').textContent=msg}
function showDashboard(){authenticated=true;$('login').classList.add('hidden');$('dashboard').classList.remove('hidden');loadSettings();refreshHealth();refreshAnalytics()}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginBtn').disabled=true;$('loginError').textContent='';try{await request('/api/owner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password:$('password').value})});$('password').value='';showDashboard()}catch(x){$('loginError').textContent=x.message}finally{$('loginBtn').disabled=false}});
async function loadSettings(){try{const d=await request('/api/control');$('notice').value=d.notice||'';$('noticeEnabled').checked=!!d.noticeEnabled;$('maintenance').checked=!!d.maintenance;$('maintenanceMessage').value=d.maintenanceMessage||'';count()}catch(x){showLogin(x.message)}}
async function refreshAnalytics(){try{const d=await request('/api/analytics');$('totalVisits').textContent=Number(d.totalVisits).toLocaleString('ar-EG');$('uniqueVisitors').textContent=Number(d.uniqueVisitors).toLocaleString('ar-EG');$('todayVisits').textContent=Number(d.todayVisits).toLocaleString('ar-EG');$('analyticsNote').textContent='زوار اليوم: '+Number(d.todayUnique).toLocaleString('ar-EG')+' · آخر تحديث: '+new Date().toLocaleTimeString('ar-EG')}catch(x){$('analyticsNote').textContent=x.message}}
async function refreshHealth(){try{const d=await request('/api/health');$('coreStatus').textContent=d.success?'ONLINE':'OFFLINE';$('coreStatus').className=d.success?'ok':'bad';$('coreDot').className='dot'+(d.success?'':' bad');$('coreDetail').textContent=d.success?'واجهة الفحص تستجيب':'فشل فحص الخدمة';$('dbStatus').textContent=d.database==='connected'?'CONNECTED':'DISCONNECTED';$('dbStatus').className=d.database==='connected'?'ok':'bad';$('dbDot').className='dot'+(d.database==='connected'?'':' bad');$('dbDetail').textContent='اتصال قاعدة البيانات';const im=!!d.features?.imageGeneration;$('imageStatus').textContent=im?'CONFIGURED':'NOT CONFIGURED';$('imageStatus').className=im?'ok':'bad';$('imageDot').className='dot'+(im?'':' bad');$('imageDetail').textContent=im?'مفتاح مزود الصور موجود':'مفتاح مزود الصور غير مضبوط';$('providerInfo').textContent='الخدمات المعلنة: '+(d.providers||[]).join(' · ');$('lastCheck').textContent='آخر فحص: '+new Date(d.timestamp||Date.now()).toLocaleTimeString('ar-EG')}catch(x){$('coreStatus').textContent='OFFLINE';$('coreStatus').className='bad';$('coreDot').className='dot bad';$('coreDetail').textContent=x.message}}
$('analyticsRefresh').addEventListener('click',refreshAnalytics);\nfunction count(){$('noticeCount').textContent=$('notice').value.length+' / 500'}$('notice').addEventListener('input',count);
$('saveBtn').addEventListener('click',async()=>{$('saveBtn').disabled=true;$('saveState').textContent='جارٍ الحفظ…';try{await request('/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',notice:$('notice').value,noticeEnabled:$('noticeEnabled').checked,maintenance:$('maintenance').checked,maintenanceMessage:$('maintenanceMessage').value})});$('saveState').textContent='تم الحفظ بنجاح. الإعدادات أصبحت فعّالة.'}catch(x){$('saveState').textContent=x.message}finally{$('saveBtn').disabled=false}});
$('refreshBtn').addEventListener('click',refreshHealth);$('logoutBtn').addEventListener('click',async()=>{try{await request('/api/owner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})})}catch{}showLogin('تم تسجيل الخروج.')});
request('/api/control').then(showDashboard).catch(()=>showLogin());setInterval(()=>{if(authenticated){refreshHealth();refreshAnalytics()}},30000)})();</script></body></html>`;

import {hasOwnerSession,setOwnerCookie,clearOwnerCookie} from '../src/lib/owner-auth.js';
import {checkRateLimit,recordAuthFail,isAuthBlocked} from '../src/lib/rate-limit.js';
function safeEqual(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
export default async function handler(req,res){
 const secret=process.env.WINE_MAINTENANCE_PASSWORD;
 if(!secret||secret.length<8){if(req.method==='GET')return res.status(503).send('Owner access is not configured.');return res.status(503).json({success:false,error:'كلمة مرور المطوّر غير مضبوطة في Vercel.'});}
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.status(200).send(DASHBOARD_HTML);}
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).end();}
 const b=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():(req.body||{});
 if(b.action==='logout'){clearOwnerCookie(res);return res.status(200).json({success:true});}
 if(b.action==='login'||!b.action){
  const ip=req.ip||req.socket?.remoteAddress||'unknown',key='wine-owner:'+ip;
  if(await isAuthBlocked(key))return res.status(429).json({success:false,error:'محاولات كثيرة. انتظر 10 دقائق ثم حاول مجدداً.'});
  if(!(await checkRateLimit(key)))return res.status(429).json({success:false,error:'طلبات كثيرة. حاول بعد دقيقة.'});
  const supplied=typeof b.password==='string'?b.password:'';
  if(!safeEqual(supplied,secret)){await recordAuthFail(key);return res.status(401).json({success:false,error:'كلمة المرور غير صحيحة.'});}
  setOwnerCookie(res);return res.status(200).json({success:true});
 }
 if(!hasOwnerSession(req))return res.status(401).json({success:false,error:'يجب تسجيل دخول المطوّر أولاً.'});
 return res.status(400).json({success:false,error:'طلب غير معروف.'});
}
