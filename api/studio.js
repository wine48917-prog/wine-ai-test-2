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
/* WINE STUDIO visual refinement */
body{background-color:#080a0e;background-image:linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px),radial-gradient(ellipse at 76% 12%,#8e344b30,transparent 35%),radial-gradient(ellipse at 8% 80%,#7f8d9c14,transparent 30%),linear-gradient(150deg,#080a0e,#0c1118 60%,#080a0e);background-size:42px 42px,42px 42px,auto,auto,auto}
.shell{width:min(1240px,100% - 52px);padding-top:18px}.top{height:72px;border-bottom-color:#ffffff1c}.mark{border-radius:12px;box-shadow:0 0 0 5px #dce4eb0a,0 10px 30px #0008}.top-actions a{border-radius:999px;padding:9px 17px}
.hero{min-height:310px;padding:52px 3px 38px;align-items:center;border-bottom:1px solid #ffffff12;margin-bottom:22px}.hero-copy{position:relative;z-index:2;max-width:720px}.hero-meta{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.live-pill,.preview-state{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #53606c66;border-radius:999px;background:#121922b8;color:#aebbc6;font:800 8px Manrope;letter-spacing:1.2px}.live-pill i,.preview-state i{width:6px;height:6px;border-radius:50%;background:#9ec5aa;box-shadow:0 0 10px #9ec5aa}
.hero h1{font-size:clamp(43px,7vw,76px);font-weight:900;line-height:1.12;letter-spacing:-2px;margin:19px 0 14px}.hero h1 span{background:linear-gradient(100deg,#f2f5f7 5%,#9eabb7 52%,#d18ba0 95%);background-clip:text;-webkit-background-clip:text}
.hero p{font-size:13px;max-width:530px;color:#aab6c1;line-height:2.1}.hero-foot{display:flex;gap:24px;margin-top:25px;color:#71808d;font:800 8px Manrope;letter-spacing:1.8px}
.hero-art{position:absolute;left:8%;top:50%;transform:translateY(-48%);width:270px;height:270px;display:grid;place-items:center;opacity:.92}.art-orbit{position:absolute;border:1px solid #d3dce51c;border-radius:50%;transform:rotate(-24deg)}.orbit-one{width:245px;height:155px}.orbit-two{width:205px;height:250px;transform:rotate(48deg);border-color:#a9436045}
.art-core{width:116px;height:116px;border-radius:34px;display:grid;place-items:center;position:relative;background:linear-gradient(145deg,#dfe6eb,#71808e 55%,#1b2631);color:#111820;font:900 66px Manrope;box-shadow:0 0 0 12px #c6d2dc0a,0 22px 65px #0009;transform:rotate(-9deg)}.art-core span{position:absolute;top:12px;right:15px;font-size:17px;color:#7e3049}.art-caption{position:absolute;bottom:5px;right:8px;color:#7e8c99;font:800 8px/1.8 Manrope;letter-spacing:2.3px;text-align:right}
.workspace{gap:18px;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr)}.panel{border-radius:25px;border-color:#ffffff1b;background:linear-gradient(145deg,#17212bdf,#0e151def 76%);box-shadow:0 28px 80px #0006,inset 0 1px #ffffff0c;backdrop-filter:blur(18px);transition:border-color .25s,transform .25s}.panel:hover{border-color:#a9b7c52e}
.editor{padding:25px}.panel-head{margin-bottom:20px}.panel-head h2,.preview-head h2{font-size:18px;font-weight:900;margin:4px 0 0}.step-label{font:800 8px Manrope;letter-spacing:2px;color:#c38b9d}.panel-index{width:38px;height:38px;border:1px solid #52606d66;border-radius:12px;display:grid;place-items:center;color:#8e9ba7;font:800 12px Manrope;background:#ffffff05}
.field-label{font-size:12px;margin-top:21px}.prompt{min-height:205px;border-radius:17px;border-color:#465462;background:linear-gradient(145deg,#090f16,#0d151e);padding:18px;font-size:13px;line-height:2.1}.prompt:focus{border-color:#c1768e;box-shadow:0 0 0 4px #a9436018,0 10px 30px #0005}
.chips{gap:8px}.chip{padding:8px 13px;border-radius:10px;background:#18222c;border-color:#34424f;font-size:10px}.chip:hover,.chip.active{background:linear-gradient(110deg,#40212e,#24202a);border-color:#a85c75}
.options{gap:12px}.select-wrap select{height:47px;border-radius:12px;background-color:#0a1118}.generate{min-height:54px;border-radius:14px;background:linear-gradient(105deg,#f1f4f6,#aab7c2 55%,#e2e8ed);box-shadow:0 10px 32px #0007,0 0 0 1px #ffffff22 inset;font-size:13px;letter-spacing:.2px}.tip{border-radius:13px;padding:13px 14px;background:linear-gradient(110deg,#2b1922a8,#171b23);border-color:#8d52654f}
.preview{padding:21px;min-height:610px}.preview-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:2px 3px 17px}.preview-head p{font-size:10px;margin-top:5px}.preview-state{white-space:nowrap}.result{margin-top:15px;min-height:450px;border:1px solid #ffffff12;border-radius:19px;background:radial-gradient(ellipse at 50% 40%,#a9b8c00d,transparent 56%),linear-gradient(145deg,#080e14,#0b121a);position:relative}.result:before{content:"";position:absolute;inset:12px;border:1px dashed #ffffff0b;border-radius:13px;pointer-events:none}
.empty{position:relative;z-index:1}.empty .glyph{border-radius:22px;background:linear-gradient(145deg,#202c37,#101821);box-shadow:0 14px 36px #0007;color:#d9e1e8;font-size:30px}.image-card{position:relative;z-index:1;padding:14px}.image-card img{border-radius:15px;box-shadow:0 16px 42px #0008}.image-actions a,.image-actions button{border-radius:12px;min-height:44px;transition:.2s}.image-actions a:hover,.image-actions button:hover{border-color:#b56b82;transform:translateY(-1px)}.error{position:relative;z-index:1}.footer{margin-top:30px}
@media(max-width:800px){.hero{min-height:260px}.hero-art{left:-28px;opacity:.34}.hero-copy{max-width:100%}.preview{min-height:500px}.result{min-height:350px}}
@media(max-width:540px){.shell{width:calc(100% - 24px);padding-top:12px}.top{height:60px}.hero{min-height:250px;padding:35px 0 25px;margin-bottom:14px}.hero h1{font-size:clamp(39px,11vw,54px);letter-spacing:-1px}.hero p{font-size:11px;max-width:90%}.hero-foot{gap:13px;font-size:7px;margin-top:18px}.hero-art{left:-92px;transform:translateY(-48%) scale(.8);opacity:.23}.hero-meta{gap:9px}.live-pill{font-size:7px}.editor{padding:17px}.preview{padding:15px;min-height:450px}.preview-head{align-items:flex-start}.preview-state{font-size:7px;padding:6px 8px}.result{min-height:320px}.prompt{min-height:170px}.panel{border-radius:20px}}
@media(prefers-reduced-motion:reduce){.panel,.image-actions a,.image-actions button{transition:none}}

/* WINE STUDIO · refreshed teal theme + mobile-first layout */
:root{--bg:#071311;--surface:#10211f;--surface2:#142a27;--line:#31534d;--muted:#a0b8b1;--silver:#e1eee9;--wine:#1d9b83;--wine2:#55c8ad}
body{background-color:#071311;background-image:linear-gradient(#d8fff008 1px,transparent 1px),linear-gradient(90deg,#d8fff008 1px,transparent 1px),radial-gradient(ellipse at 78% 8%,#1ba88b30,transparent 36%),radial-gradient(ellipse at 8% 78%,#75cbb31b,transparent 32%),linear-gradient(150deg,#071311,#0b1b19 60%,#071311)}
.hero h1 span{background:linear-gradient(100deg,#f0faf6 5%,#a8d4c7 52%,#55c8ad 95%);background-clip:text;-webkit-background-clip:text}
.eyebrow,.step-label{color:#83d6c1}
.live-pill i,.preview-state i{background:#65d7ad;box-shadow:0 0 10px #65d7ad}
.art-core{background:linear-gradient(145deg,#e8f4ef,#8eb9ac 55%,#244c43);color:#092019}
.art-core span{color:#167c69}
.panel{border-color:#31564e;background:linear-gradient(145deg,#142a27ed,#0b1b19f2)}
.panel:hover{border-color:#62bda7}
.prompt{border-color:#365c53;background:linear-gradient(145deg,#071411,#0b1c18)}
.prompt:focus{border-color:#4bc5a5;box-shadow:0 0 0 4px #25a88920,0 10px 30px #0005}
.chip{border-color:#31544b;background:#142722;color:#c8ded6}
.chip:hover,.chip.active{background:linear-gradient(110deg,#174d40,#17332e);border-color:#4bc5a5;color:#e5fff6}
.select-wrap select{border-color:#31544b;background-color:#091713}
.select-wrap select:focus{border-color:#4bc5a5}
.generate{border-color:#c4f1e2;background:linear-gradient(105deg,#e7f7f0,#9edbc8 55%,#d4f0e5);color:#092019}
.tip{background:linear-gradient(110deg,#12372f,#10211f);border-color:#367a69;color:#c4ded5}
.tip b{color:#8be0c8}
.result{border-color:#31534b;background:radial-gradient(ellipse at 50% 40%,#5dc9a512,transparent 56%),linear-gradient(145deg,#071411,#0a1b17)}
.empty .glyph{background:linear-gradient(145deg,#1c4037,#10251f);border-color:#477b6c;color:#b5efdc}
.image-actions .primary{border-color:#398b76;background:#174538;color:#d9fff1}
.image-actions a:hover,.image-actions button:hover{border-color:#57c9a8}
.error{border-color:#a15a66;background:#301d24}
@media(max-width:900px){
  .workspace{grid-template-columns:minmax(0,1fr)!important;gap:14px}
  .editor,.preview{width:100%;min-width:0}
  .preview{min-height:0}
  .result{min-height:340px}
}
@media(max-width:600px){
  html,body{width:100%;overflow-x:hidden}
  .shell{width:calc(100% - 24px)!important;max-width:100%;padding:10px 0 28px}
  .top{height:auto;min-height:58px;gap:8px}
  .top-actions{gap:6px}
  .top-actions a{padding:8px 9px;font-size:10px;white-space:nowrap}
  .hero{min-height:0;padding:28px 0 22px;margin-bottom:12px}
  .hero-copy{width:100%;min-width:0}
  .hero h1{font-size:clamp(34px,10vw,48px);line-height:1.2;overflow-wrap:anywhere}
  .hero p{max-width:100%;font-size:12px}
  .hero-art{display:none}
  .workspace{display:grid;grid-template-columns:minmax(0,1fr)!important;width:100%;gap:12px}
  .panel{width:100%;min-width:0;border-radius:18px}
  .editor{padding:15px}
  .preview{padding:14px;min-height:0}
  .prompt{width:100%;min-height:145px;resize:vertical;font-size:14px}
  .counter{align-items:flex-start;line-height:1.8}
  .counter span:first-child{max-width:78%}
  .chips{display:flex;flex-wrap:wrap}
  .chip{max-width:100%;font-size:11px}
  .options{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
  .select-wrap select{width:100%;min-width:0}
  .generate{width:100%;min-height:52px}
  .result{width:100%;min-height:280px;margin-top:12px}
  .image-card{min-width:0}
  .image-card img{max-width:100%;max-height:65vh;object-fit:contain}
  .footer{flex-wrap:wrap;line-height:1.8}
}
@media(max-width:360px){.options{grid-template-columns:1fr}.top-actions a{font-size:9px;padding:7px}.brand b{font-size:12px}}

</style>
</head>
<body>
<main class="shell">
<header class="top">
<a class="brand" href="/"><span class="mark">W</span><span><b>WINE <i>STUDIO</i></b><small>CREATIVE IMAGE WORKSPACE</small></span></a>
<nav class="top-actions"><a href="/features">مركز الأدوات</a><a href="/">الرئيسية ↗</a></nav>
</header>
<section class="hero"><div class="hero-copy"><div class="hero-meta"><span class="eyebrow">WINE ORGANIZATION / CREATIVE DIVISION</span><span class="live-pill"><i></i> CREATIVE ENGINE ONLINE</span></div><h1>حوّل الخيال<br><span>إلى شيء يُرى.</span></h1><p>استوديو إبداعي لصناعة الصور بتفاصيلك. اكتب الفكرة، اختر المزاج البصري، واترك مساحة التنفيذ لـ WINE.</p><div class="hero-foot"><span>01 — DESCRIBE</span><span>02 — CREATE</span><span>03 — COLLECT</span></div></div><div class="hero-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-core">W<span>✦</span></div><div class="art-caption">IMAGINATION<br>IN MOTION</div></div></section>
<div class="workspace">
<section class="panel editor" aria-labelledby="editorTitle">
<div class="panel-head"><div><small class="step-label">STEP 01 · INPUT</small><h2 id="editorTitle">ابنِ فكرتك</h2></div><span class="panel-index">01</span></div>
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
<div class="preview-head"><div><small class="step-label">STEP 02 · OUTPUT</small><h2 id="previewTitle">من الفكرة إلى الصورة</h2><p>مساحة العرض والنتيجة النهائية</p></div><span class="preview-state"><i></i> LIVE CANVAS</span></div>
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
