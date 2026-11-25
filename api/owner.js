import crypto from 'node:crypto';

const APP_HTML = "<!doctype html>\n<html lang=\"ar\" dir=\"rtl\">\n<head>\n<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">\n<meta name=\"theme-color\" content=\"#09090b\"><meta name=\"description\" content=\"WINE AI — مساعدك الذكي للكتابة والبرمجة وبناء الأفكار.\">\n<title>WINE AI — Intelligence, Refined</title><link rel=\"icon\" type=\"image/png\" href=\"/icon.png\">\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"/styles.css\">\n</head>\n<body>\n<div class=\"app-shell\">\n<div class=\"sidebar-scrim\" id=\"sidebarScrim\"></div><aside class=\"sidebar\" id=\"sidebar\">\n<button class=\"sidebar-close\" id=\"sidebarClose\" aria-label=\"إغلاق القائمة\">×</button><a class=\"brand\" href=\"#home\"><span class=\"brand-mark\">W</span><span><b>WINE <i>AI</i></b><small>POWERED BY WINE</small></span></a>\n<button class=\"new-chat\" id=\"newChat\"><span>＋</span> محادثة جديدة</button><div class=\"side-label\">مساحتك</div><div class=\"history\" id=\"history\"><div class=\"history-empty\">محادثاتك الجديدة هتظهر هنا</div></div>\n<div class=\"side-bottom\"><div class=\"status\"><span></span> النظام جاهز</div><div class=\"user-box\"><div class=\"avatar\" id=\"avatar\">G</div><div class=\"user-meta\"><b id=\"userLabel\">زائر</b><small id=\"userType\">Guest access</small></div><button id=\"accountBtn\" class=\"account-btn\" title=\"الحساب\">⚙</button></div>\n</aside>\n<main class=\"main\"><header class=\"topbar\"><button class=\"mobile-menu\" id=\"mobileMenu\">☰</button><div class=\"top-brand\">WINE <span>AI</span></div><div class=\"top-actions\"><span class=\"model-chip\"><i></i> WINE Intelligence</span><span class=\"guest-chip\">دخول كضيف</span></div></header>\n<section class=\"workspace\" id=\"workspace\">\n<div class=\"welcome\" id=\"welcome\"><div class=\"orb\"><div class=\"orb-core\">W</div><span class=\"orbit o1\"></span><span class=\"orbit o2\"></span><span class=\"orbit o3\"></span></div>\n<div class=\"eyebrow\"><span></span> YOUR INTELLIGENT WORKSPACE</div><h1>أهلاً بك في <em>WINE AI</em></h1><p>فكرتك تبدأ هنا. اسأل، اكتب، برمج، وابنِ شيئاً جديداً.</p>\n<div class=\"quick-grid\"><button class=\"quick-card\" data-prompt=\"ساعدني في بناء مشروع ويب كامل باستخدام React وشرح هيكل الملفات.\"><span class=\"quick-icon\">⌘</span><b>بناء مشروع</b><small>حوّل فكرتك إلى تطبيق</small></button><button class=\"quick-card\" data-prompt=\"اكتب لي كوداً احترافياً واشرح كل جزء فيه.\"><span class=\"quick-icon\">&lt;/&gt;</span><b>كتابة الأكواد</b><small>برمجة وتصحيح وشرح</small></button><button class=\"quick-card\" data-prompt=\"ساعدني في كتابة محتوى احترافي ومنظم عن فكرة سأرسلها لك.\"><span class=\"quick-icon\">✎</span><b>الكتابة والإبداع</b><small>محتوى وأفكار وصياغة</small></button><button class=\"quick-card\" data-prompt=\"ساعدني في تحليل هذه المشكلة واقترح خطة عملية لحلها.\"><span class=\"quick-icon\">◇</span><b>حل المشكلات</b><small>فكّر بخطوات واضحة</small></button></div>\n<div class=\"welcome-foot\">MORE THAN AN AI <span>•</span> BUILD · CREATE · INNOVATE</div></div>\n<div class=\"messages\" id=\"messages\" aria-live=\"polite\"></div></section>\n<div class=\"composer-wrap\"><div class=\"composer\"><textarea id=\"prompt\" rows=\"1\" placeholder=\"اكتب سؤالك أو فكرتك هنا...\" maxlength=\"12000\"></textarea><div class=\"composer-bottom\"><div class=\"composer-hint\"><span>↵</span> للإرسال · Shift + Enter لسطر جديد</div><button id=\"send\" class=\"send-btn\" aria-label=\"إرسال\">➤</button></div></div><div class=\"disclaimer\">قد يخطئ الذكاء الاصطناعي. راجع المعلومات واختبر الأكواد قبل استخدامها.</div></div>\n</main></div>\n<div class=\"modal-backdrop\" id=\"nameModal\"><section class=\"modal name-modal\"><div class=\"modal-logo\">W</div><div class=\"eyebrow\">WELCOME TO WINE AI</div><h2>أهلاً بك</h2><p class=\"modal-sub\">اكتب اسمك وابدأ الاستخدام كضيف فوراً، بدون بريد إلكتروني أو كلمة مرور.</p><form id=\"nameForm\"><label>اسمك<input id=\"guestName\" type=\"text\" placeholder=\"اكتب اسمك هنا\" minlength=\"2\" maxlength=\"30\" autocomplete=\"nickname\" required></label><button class=\"primary-btn\" type=\"submit\">ابدأ المحادثة</button><div class=\"form-error\" id=\"nameError\"></div></form><div class=\"modal-note\">يمكنك تغيير اسمك لاحقاً من زر الحساب.</div></section></div>\n<div class=\"toast\" id=\"toast\"></div><script src=\"/app.js\" defer></script>\n</body></html>";

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
