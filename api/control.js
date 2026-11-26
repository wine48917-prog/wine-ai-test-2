import {getSiteSettings,saveSiteSettings} from '../src/lib/site-control.js';
import {hasOwnerSession} from '../src/lib/owner-auth.js';
function send(res,s){return res.status(200).json({success:true,maintenance:s.maintenance,maintenanceMessage:s.maintenanceMessage,noticeEnabled:s.noticeEnabled,notice:s.notice});}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET'&&String(req.query?.public||'')==='1'){try{const s=await getSiteSettings();return res.status(200).json({success:true,maintenance:s.maintenance,noticeEnabled:s.noticeEnabled,notice:s.notice});}catch{return res.status(503).json({success:false,error:'تعذر تحميل حالة الموقع حالياً.'});}}
 if(!hasOwnerSession(req))return res.status(401).json({success:false,error:'يجب تسجيل دخول المطوّر أولاً.'});
 if(req.method==='GET'){try{return send(res,await getSiteSettings(true));}catch{return res.status(503).json({success:false,error:'تعذر قراءة إعدادات الموقع.'});}}
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({success:false,error:'Method not allowed'});}
 const b=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():(req.body||{});
 if(b.action!=='save')return res.status(400).json({success:false,error:'طلب غير معروف.'});
 const notice=typeof b.notice==='string'?b.notice.trim():'',maintenanceMessage=typeof b.maintenanceMessage==='string'?b.maintenanceMessage.trim():'';
 if(notice.length>500||maintenanceMessage.length>500)return res.status(400).json({success:false,error:'الرسالة يجب ألا تتجاوز 500 حرف.'});
 try{return send(res,await saveSiteSettings({maintenance:b.maintenance===true,maintenanceMessage:maintenanceMessage||'الموقع متوقف مؤقتاً لإجراء بعض التحسينات. سنعود قريباً.',noticeEnabled:b.noticeEnabled===true&&!!notice,notice}));}
 catch(e){console.error('[control save]',e.message);return res.status(503).json({success:false,error:'تعذر حفظ الإعدادات. تأكد من اتصال قاعدة البيانات.'});}
}
