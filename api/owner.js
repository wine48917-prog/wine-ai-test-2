import crypto from 'node:crypto';

const APP_HTML = `<!doctype html>
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

function expectedCookie(secret) {
  return crypto.createHmac('sha256', secret).update('wine-ai-owner-access-v1').digest('hex');
}
function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function hasOwnerCookie(req, secret) {
  const cookies = String(req.headers.cookie || '').split(';').map(v => v.trim());
  const entry = cookies.find(v => v.startsWith('wine_owner='));
  return !!entry && safeEqual(decodeURIComponent(entry.slice('wine_owner='.length)), expectedCookie(secret));
}

export default function handler(req, res) {
  const secret = process.env.WINE_MAINTENANCE_PASSWORD;
  if (!secret || secret.length < 20) {
    return res.status(503).json({ success: false, error: 'Owner access is not configured. Set WINE_MAINTENANCE_PASSWORD in Vercel.' });
  }

  if (req.method === 'POST') {
    const supplied = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!safeEqual(supplied, secret)) {
      return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة.' });
    }
    res.setHeader('Set-Cookie', 'wine_owner=' + expectedCookie(secret) + '; HttpOnly; Secure; SameSite=Strict; Path=/api/owner; Max-Age=28800');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    if (!hasOwnerCookie(req, secret)) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.status(200).send(APP_HTML);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
