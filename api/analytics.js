import {getSiteAnalytics} from '../db.js';
import {hasOwnerSession} from '../src/lib/owner-auth.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({success:false,error:'Method not allowed'});}
 if(!hasOwnerSession(req))return res.status(401).json({success:false,error:'يجب تسجيل دخول المطوّر أولاً.'});
 try{return res.status(200).json({success:true,...await getSiteAnalytics()});}
 catch(e){console.error('[analytics]',e.message);return res.status(503).json({success:false,error:'تعذر تحميل إحصائيات الزيارات.'});}
}
