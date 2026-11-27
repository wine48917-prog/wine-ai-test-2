import { sectionGuard } from '../src/lib/site-control.js';

const STUDIO_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#090b10">
<meta name="description" content="WINE STUDIO — مساحة إبداعية لإنشاء الصور بالذكاء الاصطناعي.">
<title>WINE STUDIO — Creative Lab</title>
<link rel="icon" href="/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#090b10;--surface:#111720;--surface2:#151e28;--line:#2d3946;--muted:#9aa8b6;--silver:#d9e1e8;--wine:#a94360;--wine2:#d16d88}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 84% 0%,#9d3d5a24,transparent 34%),radial-gradient(ellipse at 5% 72%,#9eabb914,transparent 32%),linear-gradient(155deg,#090b10,#0c1118 55%,#090b10);color:#f3f6f8;font-family:Cairo,system-ui,sans-serif}button,textarea,select{font:inherit}a{color:inherit;text-decoration:none}.shell{width:min(1180px,100% - 36px);margin:auto;padding:22px 0 42px}
.top{height:64px;display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid #ffffff16}.brand{display:flex;align-items:center;gap:11px}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#f0f3f6,#8393a1 58%,#26313d);color:#101720;font:900 22px Manrope;box-shadow:0 8px 25px #0007}.brand b{font:900 16px Manrope;letter-spacing:2px}.brand b i{font-style:normal;color:#d0dbe4}.brand small{display:block;color:#81909d;font:700 8px Manrope;letter-spacing:2.3px;margin-top:4px}.top-actions{display:flex;gap:8px}.top-actions a{padding:9px 13px;border:1px solid #34414e;border-radius:10px;background:#141c25;color:#cbd5de;font-size:11px;font-weight:800;transition:.2s}.top-actions a:hover{border-color:var(--wine2);background:#261720}
.hero{position:relative;overflow:hidden;padding:42px 0 28px;display:flex;align-items:end;justify-content:space-between;gap:20px}.eyebrow{color:#d5a6b5;font:800 9px Manrope;letter-spacing:3px}.hero h1{margin:10px 0 7px;font-size:clamp(34px,6vw,58px);line-height:1.25;letter-spacing:-1px}.hero h1 span{background:linear-gradient(100deg,#f1f4f7,#9eacb8 58%,#d18ba0);background-clip:text;-webkit-background-clip:text;color:transparent}.hero p{max-width:640px;margin:0;color:#9eabb8;font-size:13px;line-height:2}.hero-stamp{width:116px;height:116px;flex:0 0 116px;border:1px solid #c3d0db2b;border-radius:50%;display:grid;place-items:center;color:#d4dee766;font:900 60px Manrope;box-shadow:0 0 0 12px #c3d0db08,0 0 0 26px #c3d0db05}
.workspace{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:16px;align-items:stretch}.panel{min-width:0;border:1px solid #34414e;border-radius:22px;background:linear-gradient(145deg,#17212c,#101720 72%);box-shadow:0 22px 65px #0005,inset 0 1px #ffffff0a}.editor{padding:22px}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.panel-head h2{margin:0;font-size:16px}.panel-head small{color:#9eafbd;font:800 9px Manrope;letter-spacing:1.7px}.field-label{display:block;margin:17px 0 9px;color:#e1e7ec;font-size:12px;font-weight:800}.prompt-wrap{position:relative}.prompt{display:block;width:100%;min-height:190px;resize:vertical;padding:16px;border:1px solid #3a4a59;border-radius:15px;background:#0a1119;color:#f3f6f8;outline:none;font-size:13px;line-height:2;transition:.2s}.prompt::placeholder{color:#687988}.prompt:focus{border-color:#b86b82;box-shadow:0 0 0 4px #a943601b}.counter{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#788896;font-size:10px}.chips{display:flex;gap:7px;flex-wrap:wrap}.chip{padding:7px 11px;border:1px solid #394958;border-radius:999px;background:#131e29;color:#bdc9d3;font-size:10px;cursor:pointer;transition:.2s}.chip:hover,.chip.active{border-color:#a9536e;background:#2b1922;color:#f0d8e0}
.options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.select-wrap{min-width:0}.select-wrap label{display:block;margin-bottom:7px;color:#aab7c2;font-size:10px;font-weight:800}.select-wrap select{width:100%;height:43px;padding:0 12px;border:1px solid #394958;border-radius:11px;background:#0b121a;color:#e4eaf0;font-size:11px;outline:none}.select-wrap select:focus{border-color:#b86b82}
.generate{width:100%;min-height:49px;margin-top:20px;border:1px solid #d5dfe7;border-radius:13px;background:linear-gradient(110deg,#e6edf2,#aebbc6 55%,#d3dce4);color:#101820;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 10px 26px #0005;transition:.2s}.generate:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.06)}.generate:disabled{opacity:.58;cursor:wait}.tip{display:flex;align-items:flex-start;gap:9px;margin-top:15px;padding:11px 12px;border:1px solid #704154;border-radius:12px;background:linear-gradient(110deg,#281721,#171720);color:#c8b6bf;font-size:10px;line-height:1.8}.tip b{color:#e2b9c6}
.preview{padding:17px;display:flex;flex-direction:column;min-height:530px}.preview-head{padding:4px 3px 14px;border-bottom:1px solid #ffffff12}.preview-head h2{margin:0;font-size:15px}.preview-head p{margin:4px 0 0;color:#8594a2;font-size:10px}.result{flex:1;display:grid;place-items:center;min-height:390px;margin-top:14px;border:1px dashed #43515e;border-radius:16px;background:radial-gradient(ellipse at 50% 40%,#b3c1cf0b,transparent 60%),#0b121a;overflow:hidden}.empty{text-align:center;padding:25px;color:#8795a2}.empty .glyph{width:64px;height:64px;display:grid;place-items:center;margin:0 auto 14px;border:1px solid #4a5967;border-radius:20px;color:#d2dce5;font-size:28px;background:#151f29}.empty b{display:block;margin-bottom:5px;color:#e3e9ee;font-size:13px}.empty p{margin:0;font-size:10px;line-height:1.8}.loading{text-align:center;color:#9aa8b5;font-size:11px}.spinner{width:36px;height:36px;margin:0 auto 14px;border:3px solid #ffffff20;border-top-color:#d8e2ea;border-right-color:#a94360;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.error{max-width:90%;padding:16px;border:1px solid #8b4057;border-radius:12px;background:#291721;color:#f0cbd6;text-align:center;font-size:11px;line-height:1.8}.image-card{width:100%;padding:10px}.image-card img{display:block;width:100%;max-height:580px;object-fit:contain;border-radius:11px;background:#080d13}.image-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.image-actions a,.image-actions button{flex:1;min-width:115px;min-height:40px;display:flex;align-items:center;justify-content:center;padding:8px 12px;border:1px solid #455463;border-radius:10px;background:#17222d;color:#dce5ec;font-size:10px;font-weight:800;cursor:pointer}.image-actions .primary{border-color:#8e4b60;background:#2b1922;color:#f0d6df}.save-state{margin-top:8px;color:#8795a2;font-size:9px;text-align:center}
.footer{display:flex;justify-content:space-between;gap:12px;margin-top:26px;padding-top:15px;border-top:1px solid #ffffff12;color:#72808d;font:700 8px Manrope;letter-spacing:1.8px}
@media(max-width:800px){.workspace{grid-template-columns:1fr}.preview{min-height:460px}.result{min-height:330px}.hero-stamp{width:88px;height:88px;flex-basis:88px;font-size:46px}}
@media(max-width:540px){.shell{width:calc(100% - 26px);padding-top:14px}.top{height:58px}.mark{width:36px;height:36px}.brand b{font-size:14px}.brand small{font-size:7px}.top-actions a{padding:8px 9px;font-size:9px}.hero{padding:32px 0 21px}.hero h1{font-size:clamp(31px,9vw,43px)}.hero p{font-size:11px}.hero-stamp{display:none}.editor{padding:15px;border-radius:18px}.preview{padding:12px;border-radius:18px;min-height:420px}.prompt{min-height:155px}.options{gap:8px}.generate{min-height:48px}.result{min-height:300px}.footer{font-size:7px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style>
</head>
<body>
<main class="shell">
<header class="top">
<a class="brand" href="/"><span class="mark">W</span><span><b>WINE <i>STUDIO</i></b><small>CREATIVE IMAGE WORKSPACE</small></span></a>
<nav class="top-actions"><a href="/features">مركز الأدوات</a><a href="/">الرئيسية ↗</a></nav>
</header>
<section class="hero"><div><span class="eyebrow">WINE ORGANIZATION · CREATIVE LAB</span><h1>اصنع رؤيتك، <span>بأسلوبك.</span></h1><p>مساحة مستقلة لتوليد الصور، ضبط الأسلوب والتكوين، ومعاينة النتيجة ثم تحميلها أو حفظها في معرض إبداعاتك.</p></div><div class="hero-stamp" aria-hidden="true">W</div></section>
<div class="workspace">
<section class="panel editor" aria-labelledby="editorTitle">
<div class="panel-head"><h2 id="editorTitle">مساحة الإنشاء</h2><small>01 / PROMPT LAB</small></div>
<label class="field-label" for="prompt">وصف الصورة</label>
<div class="prompt-wrap"><textarea class="prompt" id="prompt" maxlength="4000" placeholder="Describe your image in English: subject, setting, lighting, colors, camera angle and details..."></textarea></div>
<div class="counter"><span>يفضّل كتابة الوصف بالإنجليزية لتوافق أفضل مع خدمة التوليد</span><span id="counter">0 / 4000</span></div>
<label class="field-label">ابدأ بفكرة سريعة</label>
<div class="chips">
<button class="chip" type="button" data-prompt="A cinematic futuristic city at night, elegant architecture, dramatic lighting, ultra detailed">مدينة مستقبلية</button>
<button class="chip" type="button" data-prompt="A premium minimalist product photograph, soft studio lighting, clean background, luxury editorial style">تصوير منتج فاخر</button>
<button class="chip" type="button" data-prompt="A dreamy surreal landscape at golden hour, atmospheric clouds, cinematic composition, fine art photography">منظر خيالي</button>
<button class="chip" type="button" data-prompt="A modern dark and silver brand identity, refined typography, minimal luxury aesthetic">هوية بصرية</button>
</div>
<div class="options">
<div class="select-wrap"><label for="style">الأسلوب الفني</label><select id="style"><option value="">تلقائي حسب الوصف</option><option value="photorealistic photography, realistic details">واقعي</option><option value="cinematic lighting, film still aesthetic">سينمائي</option><option value="3D render, polished materials">ثلاثي الأبعاد</option><option value="digital illustration, refined concept art">رسم رقمي</option><option value="minimalist luxury editorial design">بسيط وفاخر</option></select></div>
<div class="select-wrap"><label for="ratio">تكوين الصورة</label><select id="ratio"><option value="">تلقائي</option><option value="square composition, 1:1 aspect ratio">مربع 1:1</option><option value="portrait composition, 4:5 aspect ratio">طولي 4:5</option><option value="vertical composition, 9:16 aspect ratio">عمودي 9:16</option><option value="landscape composition, 16:9 aspect ratio">أفقي 16:9</option></select></div>
</div>
<button class="generate" id="generate" type="button">✦ &nbsp; إنشاء الصورة</button>
<div class="tip"><span>✧</span><div><b>نصيحة:</b> اذكر التفاصيل المهمة بوضوح. اختيار الأسلوب والتكوين يضاف إلى وصفك قبل الإرسال.</div></div>
</section>
<section class="panel preview" aria-labelledby="previewTitle">
<div class="preview-head"><h2 id="previewTitle">معاينة النتيجة</h2><p>ستظهر الصورة هنا بعد اكتمال التوليد.</p></div>
<div class="result" id="result" aria-live="polite"><div class="empty"><span class="glyph">✧</span><b>مساحتك الإبداعية جاهزة</b><p>اكتب وصفاً على اليسار ثم ابدأ الإنشاء.<br>يمكنك تحميل النتيجة أو حفظها في معرضك.</p></div></div>
</section>
</div>
<footer class="footer"><span>WINE STUDIO · POWERED BY WINE AI</span><span>© 2026 WINE ORGANIZATION</span></footer>
</main>
<script src="/studio.js" defer></script>
</body></html>`;

export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
 if(await sectionGuard(req,res,'studio'))return;
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 return res.status(200).send(STUDIO_HTML);
}
