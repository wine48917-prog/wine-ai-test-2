import pool, { ensureDatabase } from '../../db.js';
import { hasOwnerSession } from './owner-auth.js';
let cached=null,cachedAt=0;
const defaults={
 maintenance:false,maintenanceMessage:'الموقع متوقف مؤقتاً لإجراء بعض التحسينات. سنعود قريباً.',
 noticeEnabled:false,notice:'',
 sections:{
  home:{enabled:true,message:''},
  chat:{enabled:true,message:''},
  studio:{enabled:true,message:''},
  features:{enabled:true,message:''},library:{enabled:true,message:''},code:{enabled:true,message:''},profile:{enabled:true,message:''},write:{enabled:true,message:''},gallery:{enabled:true,message:''},voice:{enabled:true,message:''},notifications:{enabled:true,message:''}
 },
 copy:{homeTitle:'WINE FOR MORE THING’S',homeSubtitle:'مساحة واحدة تجمع قوة الذكاء الاصطناعي وأدوات الإبداع. اسأل، اكتب، حلّل، واصنع أفكارك — بطريقتك ومن غير تعقيد.',tools:{"eyebrow":"THE WINE AI WORKSPACE","title":"كل أدواتك، في مساحة واحدة.","description":"من الكتابة والبرمجة إلى الصوت وحفظ أعمالك — أدوات WINE AI في تجربة واحدة متناسقة، مصممة لتكون سهلة على الهاتف والكمبيوتر.","sectionLabel":"YOUR TOOLKIT","sectionTitle":"مركز الأدوات","sectionHint":"اختار الأداة وابدأ مباشرة","libraryTitle":"مكتبة المحادثات","libraryDesc":"ابحث في محادثاتك المحفوظة وصدّرها.","codeTitle":"WINE CODE","codeDesc":"اكتب الأكواد، افهمها، واكتشف الأخطاء.","profileTitle":"حساب المستخدم","profileDesc":"سجّل الدخول أو أنشئ حساباً وراجع بياناتك.","writeTitle":"WINE WRITE","writeDesc":"كتابة وتلخيص وإعادة صياغة المحتوى.","galleryTitle":"معرض الإبداعات","galleryDesc":"احفظ صورك واعرضها من جهازك.","voiceTitle":"WINE VOICE","voiceDesc":"تحدث بصوتك واستمع إلى الردود.","notificationsTitle":"مركز الإشعارات","notificationsDesc":"تابع إعلانات وتحديثات المنصة."}}
};
const keys={
 maintenance_enabled:'maintenance',maintenance_message:'maintenanceMessage',
 notice_enabled:'noticeEnabled',notice_message:'notice'
};
export async function getSiteSettings(force=false){
 if(!force&&cached&&Date.now()-cachedAt<2000)return structuredClone(cached);
 await ensureDatabase();
 const [rows]=await pool.query('SELECT setting_key,setting_value FROM site_settings');
 const v=Object.fromEntries(rows.map(r=>[r.setting_key,r.setting_value]));
 const s=structuredClone(defaults);
 s.maintenance=v.maintenance_enabled==='1';
 s.maintenanceMessage=v.maintenance_message||defaults.maintenanceMessage;
 s.noticeEnabled=v.notice_enabled==='1';s.notice=v.notice_message||'';
 for(const section of ['home','chat','studio','features','library','code','profile','write','gallery','voice','notifications']){
  const prefix='section_'+section+'_';
  if(v[prefix+'enabled']!==undefined)s.sections[section].enabled=v[prefix+'enabled']==='1';
  s.sections[section].message=v[prefix+'message']||'';
 }
 s.copy.homeTitle=v.copy_home_title||defaults.copy.homeTitle;
 s.copy.homeSubtitle=v.copy_home_subtitle||defaults.copy.homeSubtitle;
 s.copy.tools={...defaults.copy.tools};for(const key of Object.keys(defaults.copy.tools))s.copy.tools[key]=v['copy_tools_'+key]||defaults.copy.tools[key];
 cached=s;cachedAt=Date.now();return structuredClone(s);
}
export async function saveSiteSettings(values){
 await ensureDatabase();
 const current=await getSiteSettings(true);
 const s={...current,...values,sections:{...current.sections,...(values.sections||{})},copy:{...current.copy,...(values.copy||{})}};
 const entries={
  maintenance_enabled:s.maintenance?'1':'0',
  maintenance_message:String(s.maintenanceMessage||defaults.maintenanceMessage).slice(0,500),
  notice_enabled:s.noticeEnabled?'1':'0',
  notice_message:String(s.notice||'').slice(0,500),
  copy_home_title:String(s.copy.homeTitle||defaults.copy.homeTitle).slice(0,120),
  copy_home_subtitle:String(s.copy.homeSubtitle||defaults.copy.homeSubtitle).slice(0,500),
  ...Object.fromEntries(Object.keys(defaults.copy.tools).map(key=>['copy_tools_'+key,String(s.copy.tools?.[key]||defaults.copy.tools[key]).slice(0,500)]))
 };
 for(const section of ['home','chat','studio','features','library','code','profile','write','gallery','voice','notifications']){
  const x=s.sections[section]||defaults.sections[section];
  entries['section_'+section+'_enabled']=x.enabled===false?'0':'1';
  entries['section_'+section+'_message']=String(x.message||'').slice(0,500);
 }
 for(const [key,value] of Object.entries(entries))
  await pool.query('INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',[key,value]);
 cached=null;return getSiteSettings(true);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function blocked(req,res,message){
 const msg=esc(message||'هذا القسم متوقف مؤقتاً من إدارة WINE AI.');
 res.setHeader('Cache-Control','no-store');
 if(String(req.headers.accept||'').includes('text/html')&&req.method==='GET'){
  res.status(503).setHeader('Retry-After','900').setHeader('Content-Type','text/html; charset=utf-8');
  return res.end('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WINE AI</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09090c;color:#f4edf1;font-family:Arial;padding:24px}.card{max-width:520px;text-align:center;padding:34px 26px;border:1px solid #593044;border-radius:24px;background:#151016}.mark{font-size:30px;color:#d86a89;font-weight:900}p{color:#b7aab3;line-height:2}</style><main class="card"><div class="mark">WINE AI</div><h1>القسم متوقف مؤقتاً</h1><p>'+msg+'</p><div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:22px"><a style="color:#d86a89;border:1px solid #704052;border-radius:10px;padding:11px 16px;text-decoration:none" href="/developer">دخول المالك · OWENR</a><a style="color:#c9c9d0;border:1px solid #39343a;border-radius:10px;padding:11px 16px;text-decoration:none" href="/">العودة للرئيسية</a></div></main></html>');
 }
 return res.status(503).json({success:false,disabled:true,error:message||'هذا القسم متوقف مؤقتاً.'});
}
async function settingsOrPass(){try{return await getSiteSettings();}catch(e){console.error('[site-control]',e.message);return null;}}
export async function maintenanceGuard(req,res){const s=await settingsOrPass();if(!s)return false;if(s.maintenance)return blocked(req,res,s.maintenanceMessage);return false;}
export async function sectionGuard(req,res,section){if(hasOwnerSession(req))return false;const s=await settingsOrPass();if(!s)return false;if(s.maintenance)return blocked(req,res,s.maintenanceMessage);const item=s.sections?.[section];if(item&&item.enabled===false)return blocked(req,res,item.message);return false;}
