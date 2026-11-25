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
.workbench{padding:22px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,#151d28,#0d1219);box-shadow:0 20px 60px #0005}.workbench label{display:block;margin-bottom:10px;font-size:13px;font-weight:700}textarea{display:block;width:100%;resize:vertical;min-height:125px;padding:15px;border:1px solid #ffffff20;border-radius:13px;background:#080d14;color:#fff;font:14px Cairo;outline:none}textarea:focus{border-color:#d9c29a88;box-shadow:0 0 0 3px #d9c29a12}.controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px}.hint{color:var(--muted);font-size:11px}button{border:0;border-radius:12px;padding:12px 21px;background:linear-gradient(120deg,#d9c29a,#a98a59);color:#21170d;font:800 13px Cairo;cursor:pointer}button:disabled{opacity:.6;cursor:wait}
.result{margin-top:24px}.empty,.loading,.error{padding:35px 18px;text-align:center;border:1px dashed #ffffff22;border-radius:18px;color:var(--muted)}.empty b,.loading b{display:block;color:#eee;margin:8px}.empty span{font-size:32px;color:var(--gold)}.spinner{width:30px;height:30px;border:3px solid #ffffff20;border-top-color:var(--gold);border-radius:50%;display:block;margin:0 auto 12px;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.image-card{padding:12px;border:1px solid var(--line);border-radius:18px;background:#111720}.image-card img{display:block;width:100%;height:auto;border-radius:12px}.actions{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 3px 2px}.actions a{color:var(--gold);text-decoration:none;font-size:12px}.actions span{color:#8993a0;font-size:10px}
.foot{text-align:center;color:#66717e;font:600 9px Manrope;letter-spacing:2px;margin-top:34px}
@media(max-width:560px){.shell{padding:18px 14px 38px}.hero{margin:34px 0 22px}.spark{font-size:42px}.workbench{padding:15px}.controls{align-items:stretch;flex-direction:column}.controls button{width:100%}.actions{align-items:flex-start;flex-direction:column}}
</style></head>
<body><main class="shell">
<header class="top"><a class="brand" href="/"><span class="mark">W</span><span><b>WINE STUDIO</b><small>CREATIVE IMAGE LAB</small></span></a><a class="back" href="/">← العودة إلى WINE AI</a></header>
<section class="hero"><div><span class="kicker">WINE CREATIVE LAB</span><h1>اصنع خيالك مع <em>WINE STUDIO</em></h1><p class="desc">مساحة مستقلة لإنشاء الصور وتحميلها بتوقيع WINE.</p></div><div class="spark">✧</div></section>
<section class="workbench"><label for="prompt">وصف الصورة</label><textarea id="prompt" maxlength="4000" placeholder="اكتب وصف الصورة بالتفصيل..."></textarea><div class="controls"><span class="hint">حتى 4000 حرف</span><button id="generate">✧ إنشاء الصورة</button></div></section>
<section class="result" id="result"><div class="empty"><span>✧</span><b>مساحتك الإبداعية</b>الصورة التي تنشئها ستظهر هنا</div></section>
<footer class="foot">© 2026 WINE ORGANIZATION</footer></main><script src="/studio.js" defer></script></body></html>`;

export default function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end();}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 return res.status(200).send(STUDIO_HTML);
}
