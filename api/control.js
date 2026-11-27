import {getSiteSettings,saveSiteSettings} from '../src/lib/site-control.js';
import {hasOwnerSession} from '../src/lib/owner-auth.js';
function send(res,s,publicOnly=false){
 const data={success:true,maintenance:s.maintenance,maintenanceMessage:s.maintenanceMessage,noticeEnabled:s.noticeEnabled,notice:s.notice,sections:s.sections,copy:s.copy};
 if(publicOnly){delete data.maintenanceMessage;return res.status(200).json(data);}
 return res.status(200).json(data);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const isPublic=req.method==='GET'&&String(req.query?.public||'')==='1';
 if(!isPublic&&!hasOwnerSession(req))return res.status(401).json({success:false,error:'يجب تسجيل دخول المطوّر أولاً.'});
 if(req.method==='GET'){try{return send(res,await getSiteSettings(true),isPublic);}catch(e){console.error('[control read]',e.message);return res.status(503).json({success:false,error:'تعذر قراءة إعدادات الموقع.'});}}
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({success:false,error:'Method not allowed'});}
 const b=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():(req.body||{});
 if(b.action!=='save'&&b.action!=='saveAll')return res.status(400).json({success:false,error:'طلب غير معروف.'});
 const sectionNames=['home','chat','studio','features','library','code','profile','write','gallery','voice','notifications'];
 const lengths=[b.notice,b.maintenanceMessage,b.copy?.homeTitle,b.copy?.homeSubtitle,...sectionNames.map(key=>b.sections?.[key]?.message)];
 if(lengths.some(x=>x!==undefined&&typeof x!=='string')||lengths.some(x=>typeof x==='string'&&x.length>500))return res.status(400).json({success:false,error:'تأكد من النصوص؛ الحد الأقصى 500 حرف لكل رسالة.'});
 try{
  const values=b.action==='saveAll'?{
   maintenance:b.maintenance===true,
   maintenanceMessage:b.maintenanceMessage,
   noticeEnabled:b.noticeEnabled===true,
   notice:b.notice,
   sections:Object.fromEntries(sectionNames.map(key=>[key,{enabled:b.sections?.[key]?.enabled!==false,message:typeof b.sections?.[key]?.message==='string'?b.sections[key].message:''}])),
   copy:{homeTitle:b.copy?.homeTitle,homeSubtitle:b.copy?.homeSubtitle}
  }:{
   maintenance:b.maintenance===true,maintenanceMessage:b.maintenanceMessage,
   noticeEnabled:b.noticeEnabled===true,notice:b.notice
  };
  return send(res,await saveSiteSettings(values));
 }catch(e){console.error('[control save]',e.message);return res.status(503).json({success:false,error:'تعذر حفظ الإعدادات. تأكد من اتصال قاعدة البيانات.'});}
}
