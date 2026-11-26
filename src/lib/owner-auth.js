import crypto from 'node:crypto';
function safeEqual(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
export function ownerCookieValue(secret=process.env.WINE_MAINTENANCE_PASSWORD){return crypto.createHmac('sha256',secret).update('wine-ai-owner-access-v2').digest('hex');}
export function hasOwnerSession(req){
 const secret=process.env.WINE_MAINTENANCE_PASSWORD;if(!secret)return false;
 const entry=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('wine_owner='));if(!entry)return false;
 let value='';try{value=decodeURIComponent(entry.slice(11));}catch{return false;}
 return safeEqual(value,ownerCookieValue(secret));
}
export function setOwnerCookie(res){res.setHeader('Set-Cookie','wine_owner='+ownerCookieValue()+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800');res.setHeader('Cache-Control','no-store');}
export function clearOwnerCookie(res){res.setHeader('Set-Cookie','wine_owner=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');res.setHeader('Cache-Control','no-store');}
