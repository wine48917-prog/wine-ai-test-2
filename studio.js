const $=s=>document.querySelector(s);
let busy=false,objectUrl=null;
async function ensureGuest(){
 let token=localStorage.getItem('wine_token')||'';
 if(token)return token;
 const name=localStorage.getItem('wine_name')||'زائر';
 const r=await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
 const d=await r.json();if(!r.ok||!d.token)throw new Error(d.error||'تعذر بدء جلسة الزائر');
 localStorage.setItem('wine_token',d.token);localStorage.setItem('wine_name',d.name||name);localStorage.setItem('wine_guest','1');return d.token;
}
async function generate(){
 const prompt=$('#prompt').value.trim(),button=$('#generate'),result=$('#result');
 if(!prompt){result.innerHTML='<div class="error">اكتب وصف الصورة أولاً.</div>';return}
 if(busy)return;busy=true;button.disabled=true;button.textContent='جارٍ الإبداع...';
 result.innerHTML='<div class="loading"><span class="spinner"></span><b>WINE STUDIO يصنع صورتك</b>قد يستغرق ذلك بعض الوقت</div>';
 try{
  const token=await ensureGuest();
  const response=await fetch('/api/star-x-image',{method:'POST',headers:{'Content-Type':'application/json','X-User-Token':`Bearer ${token}`},body:JSON.stringify({prompt})});
  if(!response.ok){let e={};try{e=await response.json()}catch{}throw new Error(e.error||'تعذر توليد الصورة')}
  const source=await response.blob();if(!source.type.startsWith('image/'))throw new Error('لم تصل صورة صالحة');
  const bitmap=await createImageBitmap(source),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);const scale=Math.max(1,Math.min(canvas.width,canvas.height)/900),size=Math.max(11,Math.round(13*scale)),pad=Math.round(12*scale),label='WINE STUDIO AI © 2026 WINE Organization';
  ctx.save();ctx.font='600 '+size+'px Manrope, Arial, sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';
  const w=ctx.measureText(label).width+pad*1.5,h=size+pad,x=canvas.width-pad,y=canvas.height-pad;
  ctx.fillStyle='rgba(8,10,16,.34)';ctx.fillRect(x-w,y-h,w,h);ctx.fillStyle='rgba(255,255,255,.58)';ctx.fillText(label,x-pad*.65,y-pad*.45);ctx.restore();bitmap.close();
  const finalBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!finalBlob)throw new Error('تعذر تجهيز الصورة');
  if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(finalBlob);
  result.innerHTML='';const card=document.createElement('div');card.className='image-card';const img=document.createElement('img');img.src=objectUrl;img.alt='WINE Studio generated image';
  const actions=document.createElement('div');actions.className='actions';const link=document.createElement('a');link.href=objectUrl;link.download='wine-studio-ai.png';link.textContent='↓ تحميل الصورة';
  const rights=document.createElement('span');rights.textContent='© 2026 WINE Organization · WINE STUDIO AI';actions.append(link,rights);card.append(img,actions);result.append(card);
 }catch(e){result.innerHTML='<div class="error"></div>';result.firstElementChild.textContent=e.message||'حدث خطأ غير متوقع'}
 finally{busy=false;button.disabled=false;button.textContent='✧ إنشاء الصورة'}
}
$('#generate').addEventListener('click',generate);
$('#prompt').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')generate()});
