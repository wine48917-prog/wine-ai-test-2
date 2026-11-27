import { sectionGuard } from '../src/lib/site-control.js';
const STUDIO_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#080b0f"><title>WINE STUDIO — Creative Lab</title>
<link rel="icon" href="/icon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#080b0f;--panel:#111720;--line:#ffffff18;--muted:#9ba6b5;--gold:#d9c29a;--accent:#b9a17a}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 80% 0%,#b99a641c,transparent 38%),radial-gradient(ellipse at 0% 100%,#9c6d3214,transparent 38%),var(--bg);color:#f5f3ef;font-family:Cairo,sans-serif}
.shell{width:min(960px,100%);margin:auto;padding:26px 22px 60px}.top{display:flex;justify-content:space-between;align-items:center;gap:15px;padding-bottom:22px;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none}.mark{width:42px;height:42px;display:grid;place-items:center;border:1px solid #d9c29a77;border-radius:13px;color:var(--gold);font:800 22px Manrope}.brand b{font:800 17px Manrope;letter-spacing:2px}.brand small{display:block;color:var(--muted);font:600 9px Manrope;letter-spacing:2px}
.back{color:#d9c29a;text-decoration:none;border:1px solid var(--line);padding:9px 14px;border-radius:11px;font-size:12px}.back:hover{border-color:#d9c29a77}
.hero{display:flex;justify-content:space-between;align-items:center;gap:20px;margin:48px 0 28px}.kicker{font:700 10px Manrope;letter-spacing:3px;color:var(--gold)}h1{font-size:clamp(34px,7vw,58px);line-height:1.2;margin:9px 0}h1 em{font-style:normal;color:var(--gold)}.desc{margin:0;color:var(--muted);font-size:14px;line-height:2}.spark{font-size:60px;color:#d9c29a66}
.workbench{padding:22px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,#151d28,#0d1219);box-shadow:0 20px 60px #0005}.english-notice{display:flex;align-items:center;gap:12px;margin:0 0 20px;padding:13px 15px;border:1px solid #d9c29a55;border-radius:13px;background:linear-gradient(110deg,#d9c29a16,#ffffff05);direction:ltr;text-align:left}.notice-icon{width:28px;height:28px;flex:0 0 28px;display:grid;place-items:center;border:1px solid #d9c29a88;border-radius:50%;color:var(--gold);font:800 15px Manrope}.english-notice b{display:block;color:var(--gold);font:800 11px Manrope;letter-spacing:1px}.english-notice p{margin:3px 0 0;color:#c4cbd3;font:500 12px/1.6 Manrope}.workbench label{display:block;margin-bottom:10px;font-size:13px;font-weight:700}textarea{display:block;width:100%;resize:vertical;min-height:125px;padding:15px;border:1px solid #ffffff20;border-radius:13px;background:#080d14;color:#fff;font:14px Cairo;outline:none}textarea:focus{border-color:#d9c29a88;box-shadow:0 0 0 3px #d9c29a12}.controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px}.hint{color:var(--muted);font-size:11px}button{border:0;border-radius:12px;padding:12px 21px;background:linear-gradient(120deg,#d9c29a,#a98a59);color:#21170d;font:800 13px Cairo;cursor:pointer}button:disabled{opacity:.6;cursor:wait}
.result{margin-top:24px}.empty,.loading,.error{padding:35px 18px;text-align:center;border:1px dashed #ffffff22;border-radius:18px;color:var(--muted)}.empty b,.loading b{display:block;color:#eee;margin:8px}.empty span{font-size:32px;color:var(--gold)}.spinner{width:30px;height:30px;border:3px solid #ffffff20;border-top-color:var(--gold);border-radius:50%;display:block;margin:0 auto 12px;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.image-card{padding:12px;border:1px solid var(--line);border-radius:18px;background:#111720}.image-card img{display:block;width:100%;height:auto;border-radius:12px}.actions{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 3px 2px}.actions a{color:var(--gold);text-decoration:none;font-size:12px}.actions span{color:#8993a0;font-size:10px}
.foot{text-align:center;color:#66717e;font:600 9px Manrope;letter-spacing:2px;margin-top:34px}
@media(max-width:560px){.shell{padding:18px 14px 38px}.hero{margin:34px 0 22px}.spark{font-size:42px}.workbench{padding:15px}.controls{align-items:stretch;flex-direction:column}.controls button{width:100%}.actions{align-items:flex-start;flex-direction:column}}

/* WINE STUDIO — platinum / graphite redesign */
:root{--bg:#090b0f;--panel:#111720;--line:#303b47;--muted:#9aa7b4;--gold:#cbd5de;--accent:#9c3855}
body{background:radial-gradient(ellipse at 78% 4%,#9c38551b,transparent 34%),radial-gradient(ellipse at 8% 88%,#8fa6b414,transparent 35%),linear-gradient(145deg,#090b0f,#0d1219 58%,#090b0f);color:#f1f4f7}
.shell{width:min(1120px,100%);padding:25px 26px 56px}
.top{padding:0 0 19px;border-bottom-color:#ffffff16}
.mark{border:1px solid #aebbc6;border-radius:13px;background:linear-gradient(145deg,#eef2f5,#8795a1 52%,#28333e);color:#111820;box-shadow:0 8px 28px #0008,inset 0 1px #fff}
.brand b{letter-spacing:2.4px}.brand small{color:#83909d;letter-spacing:2.5px}
.back{border-color:#3a4652;background:#141b23;color:#d5dfe7;transition:.2s}.back:hover{border-color:#9c3855;background:#21151d;transform:translateY(-1px)}
.hero{margin:52px 0 30px;padding:0 4px;min-height:210px;position:relative}
.hero:after{content:'W';position:absolute;left:8%;top:-20px;width:175px;height:175px;display:grid;place-items:center;border:1px solid #aab9c51a;border-radius:50%;color:#d6e0e91a;font:900 118px Manrope;box-shadow:0 0 0 18px #aab9c508,0 0 0 38px #aab9c505;pointer-events:none}
.kicker{color:#bdcbd6;letter-spacing:3.5px}.hero h1{font-size:clamp(36px,6vw,62px);letter-spacing:-1.2px;max-width:720px}.hero h1 em{background:linear-gradient(100deg,#f3f6f8,#9baab7 65%,#d6a9b8);background-clip:text;-webkit-background-clip:text;color:transparent}.desc{max-width:600px;color:#a8b2bd;font-size:14px}.spark{color:#d6e0e955;font-size:76px;text-shadow:0 0 40px #9c385533;z-index:1}
.workbench{position:relative;overflow:hidden;padding:25px;border:1px solid #3b4651;border-radius:23px;background:linear-gradient(145deg,#171f29f2,#10161ef5 72%);box-shadow:0 25px 80px #0006,inset 0 1px #ffffff0b}
.workbench:before{content:'';position:absolute;top:0;right:8%;width:190px;height:1px;background:linear-gradient(90deg,transparent,#c8d4de,transparent);opacity:.7}
.english-notice{border-color:#744154;background:linear-gradient(110deg,#291923,#171820);border-radius:14px;padding:14px 16px}
.notice-icon{border-color:#a65b73;color:#e0aabc;background:#a43c5a18}.english-notice b{color:#e2b9c7}.english-notice p{color:#c1b6be}
.workbench label{font-size:13px;color:#e2e8ed;margin-bottom:11px}
textarea{min-height:150px;padding:18px 19px;border:1px solid #354452;border-radius:15px;background:linear-gradient(145deg,#0a1017,#0d141c);color:#f4f6f8;font-size:14px;line-height:2;transition:border-color .2s,box-shadow .2s}
textarea::placeholder{color:#71808d}textarea:focus{border-color:#9b6578;box-shadow:0 0 0 4px #9c38551c,0 12px 35px #0003}
.controls{margin-top:18px}.hint{color:#8d9aa7}
button{min-height:46px;padding:12px 24px;border:1px solid #c5d0d9;background:linear-gradient(120deg,#e2e8ed,#8797a4 62%,#c2ccd4);color:#111820;box-shadow:0 8px 24px #0005;transition:transform .2s,filter .2s,box-shadow .2s}
button:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);box-shadow:0 12px 28px #0007}
.result{margin-top:25px;min-height:120px}.empty,.loading,.error{border:1px dashed #45515e;border-radius:19px;background:linear-gradient(145deg,#111923aa,#0d131baa);color:#9aa7b4;padding:40px 18px}.empty span{color:#d5dfe7;font-size:35px}.empty b,.loading b{color:#e8edf1;font-size:14px}
.spinner{border-color:#ffffff20;border-top-color:#d2dce4}
.image-card{padding:13px;border:1px solid #3c4854;border-radius:20px;background:linear-gradient(145deg,#17212b,#0e141b);box-shadow:0 20px 55px #0005}.image-card img{border-radius:14px}.actions a{display:inline-flex;align-items:center;gap:8px;border:1px solid #9c3855;border-radius:10px;background:#281721;padding:10px 15px;color:#e6c5d0;font-weight:800;transition:.2s}.actions a:hover{background:#3a1d2a;border-color:#c06b86}.actions span{color:#84919d}
.foot{color:#687582;border-top:1px solid #ffffff12;padding-top:18px;letter-spacing:2.2px}
@media(max-width:650px){.shell{padding:17px 14px 38px}.hero{margin:37px 0 23px;min-height:0}.hero:after{left:0;top:0;width:110px;height:110px;font-size:72px;opacity:.55}.hero h1{font-size:clamp(32px,9vw,45px);max-width:90%}.spark{font-size:48px}.workbench{padding:16px;border-radius:18px}.english-notice{padding:11px}.controls{gap:13px}.controls button{min-height:48px}.empty,.loading,.error{padding:32px 14px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
</style></head>
<body><main class="shell">
<header class="top"><a class="brand" href="/"><span class="mark">W</span><span><b>WINE <i style="font-style:normal;color:#b8c7d2">STUDIO</i></b><small>CREATIVE IMAGE LAB · 2026</small></span></a><a class="back" href="/">← العودة إلى WINE AI</a></header>

<section class="hero"><div><span class="kicker">✦ &nbsp; WINE CREATIVE LAB</span><h1>حوّل فكرتك إلى <em>عمل فني.</em></h1><p class="desc">مساحة إبداعية متكاملة لإنشاء الصور بالذكاء الاصطناعي. اكتب وصفك، أطلق خيالك، وحمّل النتيجة بتوقيع WINE.</p></div><div class="spark" aria-hidden="true">✧</div></section>
<section class="workbench"><div class="english-notice" role="note"><span class="notice-icon">!</span><div><b>Important</b><p>Please describe your image in English before generating it.</p></div></div><label for="prompt">وصف الصورة <span style="color:#8d9aa7;font-size:10px;font-weight:500">· IMAGE PROMPT</span></label><textarea id="prompt" maxlength="4000" placeholder="Describe your image in English..."></textarea><div class="controls"><span class="hint">حتى 4000 حرف · وصف واضح = نتيجة أفضل</span><button id="generate">✧ &nbsp; إنشاء الصورة</button></div></section>
<section class="result" id="result"><div class="empty"><span>✧</span><b>مساحتك الإبداعية</b>الصورة التي تنشئها ستظهر هنا</div></section>
<footer class="foot">© 2026 WINE ORGANIZATION</footer></main><script src="/studio.js" defer></script></body></html>`;

export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
  if (await sectionGuard(req, res, 'studio')) return;
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 return res.status(200).send(STUDIO_HTML);
}
