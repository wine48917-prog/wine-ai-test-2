import pool, { ensureDatabase } from '../../db.js';
let cached=null,cachedAt=0;
export async function getSiteSettings(force=false){
 if(!force&&cached&&Date.now()-cachedAt<2500)return {...cached};
 await ensureDatabase();
 const [rows]=await pool.query("SELECT setting_key,setting_value FROM site_settings WHERE setting_key IN ('maintenance_enabled','maintenance_message','notice_enabled','notice_message')");
 const v=Object.fromEntries(rows.map(r=>[r.setting_key,r.setting_value]));
 cached={maintenance:v.maintenance_enabled==='1',maintenanceMessage:v.maintenance_message||'الموقع متوقف مؤقتاً لإجراء بعض التحسينات. سنعود قريباً.',noticeEnabled:v.notice_enabled==='1',notice:v.notice_message||''};
 cachedAt=Date.now();return {...cached};
}
export async function saveSiteSettings(values){
 await ensureDatabase();
 const entries={maintenance_enabled:values.maintenance?'1':'0',maintenance_message:String(values.maintenanceMessage||'').slice(0,500),notice_enabled:values.noticeEnabled?'1':'0',notice_message:String(values.notice||'').slice(0,500)};
 for(const [key,value] of Object.entries(entries))await pool.query('INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',[key,value]);
 cached=null;return getSiteSettings(true);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export async function maintenanceGuard(req,res){
 let s;try{s=await getSiteSettings();}catch(e){console.error('[site-control]',e.message);return false;}
 if(!s.maintenance)return false;
 const msg=esc(s.maintenanceMessage);
 if(String(req.headers.accept||'').includes('text/html')&&req.method==='GET'){
  res.status(503);res.setHeader('Cache-Control','no-store');res.setHeader('Retry-After','900');res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WINE AI — صيانة</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 80% 0,#67172e55,transparent 40%),#09090c;color:#f4edf1;font-family:Arial,sans-serif}.card{width:min(520px,100%);padding:34px 26px;text-align:center;border:1px solid #593044;border-radius:24px;background:#151016}.mark{width:58px;height:58px;margin:auto;display:grid;place-items:center;border-radius:18px;background:#8d2341;font-size:30px;font-weight:900}.tag{margin-top:24px;color:#c04a68;font-size:11px;letter-spacing:3px;font-weight:800}h1{font-size:29px;margin:12px 0}p{color:#b7aab3;line-height:2;font-size:14px}</style><main class="card"><div class="mark">W</div><div class="tag">WINE AI · MAINTENANCE</div><h1>نعود إليك قريباً</h1><p>'+msg+'</p></main></html>');return true;
 }
 res.status(503);res.setHeader('Retry-After','900');res.setHeader('Cache-Control','no-store');res.json({success:false,maintenance:true,error:s.maintenanceMessage});return true;
}
