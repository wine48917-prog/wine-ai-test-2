const $=s=>document.querySelector(s);
const state={token:localStorage.getItem('wine_token')||'',guest:localStorage.getItem('wine_guest')==='1',name:localStorage.getItem('wine_name')||'',email:'',mode:'guest',sessionId:null,threads:JSON.parse(localStorage.getItem('wine_threads')||'[]'),active:null,busy:false};
const messages=$('#messages'),welcome=$('#welcome'),promptInput=$('#prompt');
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function setIdentity(){const label=state.name||'زائر';$('#userLabel').textContent=label;$('#userType').textContent='Guest · زائر';$('#avatar').textContent=Array.from(label)[0]?.toUpperCase()||'ز';}
function saveThreads(){
 try{localStorage.setItem('wine_threads',JSON.stringify(state.threads));}
 catch{toast('تعذر حفظ سجل المحادثات على هذا الجهاز.');}
 renderHistory();
}
function renderHistory(){const el=$('#history');$('#historyCount').textContent=String(state.threads.length).padStart(2,'0');if(!state.threads.length){el.innerHTML='<div class="history-empty">محادثاتك هتظهر هنا</div>';return}el.innerHTML=state.threads.slice().reverse().map(t=>`<button type="button" class="history-item ${t.id===state.active?'active':''}" data-id="${t.id}"><span class="history-item-icon">◌</span><span class="history-item-title">${escapeHtml(t.title||'محادثة جديدة')}</span><span class="history-item-arrow">‹</span></button>`).join('')}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function highlightCode(code,language='') {
  const escaped=escapeHtml(code);
  const lang=String(language||'').toLowerCase();
  const rules=[
    {type:'comment',re:/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g},
    {type:'string',re:/("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|`(?:\\\\.|[^`\\\\])*`)/g},
    {type:'number',re:/\b\d+(?:\.\d+)?\b/g},
    {type:'keyword',re:/\b(const|let|var|function|return|if|else|for|while|class|new|this|async|await|import|from|export|default|try|catch|throw|extends|switch|case|break|continue|public|private|static|void|int|string|boolean|def|lambda|pass|None|True|False|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|JOIN|AND|OR)\b/g},
    {type:'function',re:/\b([A-Za-z_$][\w$]*)(?=\s*\()/g},
    {type:'tag',re:/(&lt;\/?[A-Za-z][^&]*?&gt;)/g}
  ];
  let tokens=[],masked=escaped.replace(/&lt;\/?[A-Za-z][^&]*?&gt;/g,m=>{tokens.push({v:m,t:'tag'});return '\u0000'+(tokens.length-1)+'\u0000'});
  for(const rule of rules.slice(0,5)){
    masked=masked.replace(rule.re,m=>{tokens.push({v:m,t:rule.type});return '\u0000'+(tokens.length-1)+'\u0000'});
  }
  masked=masked.replace(/\u0000(\d+)\u0000/g,(_,i)=>{const x=tokens[Number(i)];return x?'<span class="tok-'+x.t+'">'+x.v+'</span>':''});
  return masked;
}
function renderText(text){
  const blocks=[];
  let html=escapeHtml(String(text||'')).replace(/```([\w+#.-]*)\n?([\s\S]*?)```/g,(_,lang,code)=>{
    const id=blocks.length;blocks.push({lang,code:code.replace(/\n$/,'')});
    return '\u0001CODE'+id+'\u0001';
  });
  html=html.replace(/`([^`\n]+)`/g,'<code class="inline-code">$1</code>');
  html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/(^|\n)###?\s+([^\n]+)/g,'$1<strong class="md-heading">$2</strong>');
  html=html.replace(/\n/g,'<br>');
  return html.replace(/\u0001CODE(\d+)\u0001/g,(_,i)=>{
    const b=blocks[Number(i)],lang=escapeHtml(b.lang||'code'),decoded=b.code.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'),code=highlightCode(decoded,b.lang);
    return '<section class="code-card"><div class="code-toolbar"><span>'+lang+'</span><button type="button" class="copy-code" data-copy="'+Number(i)+'">نسخ الكود</button></div><pre><code>'+code+'</code></pre></section>';
  });
}
function addMessage(role,text){
 welcome.style.display='none';messages.classList.add('active');
 const item=document.createElement('div');item.className=`message ${role}`;
 const avatar=document.createElement('div');avatar.className='message-avatar';avatar.textContent=role==='user'?'YOU':'W';
 const bubble=document.createElement('div');bubble.className='bubble';
 if(role==='assistant')bubble.innerHTML=renderText(text);else bubble.textContent=text||'';
 item.append(avatar,bubble);messages.appendChild(item);if(role==='assistant'){const actions=document.createElement('div');actions.className='message-actions';actions.innerHTML='<button type="button" data-copy-message>نسخ الرد</button><span>WINE AI</span>';item.appendChild(actions)}messages.scrollTop=messages.scrollHeight;return item;
}
function newThread(){state.active=null;state.sessionId=null;messages.innerHTML='';messages.classList.remove('active');welcome.style.display='block';$('#activeTitle').textContent='مساحة المحادثة';renderHistory();closeSidebar();promptInput.focus()}
function currentThread(){let t=state.threads.find(x=>x.id===state.active);if(!t){t={id:crypto.randomUUID(),title:'محادثة جديدة',items:[]};state.threads.push(t);state.active=t.id}return t}
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#sidebarScrim').classList.remove('show'); }
function toggleSidebar(){const open=!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',open);$('#sidebarScrim').classList.toggle('show',open)}
function openThread(id){const t=state.threads.find(x=>x.id===id);if(!t)return;state.active=id;state.sessionId=t.sessionId||null;messages.innerHTML='';messages.classList.add('active');welcome.style.display='none';t.items.forEach(m=>addMessage(m.role,m.text));renderHistory();closeSidebar()}
async function ensureGuest(){if(state.token)return true;const r=await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:state.name||'زائر'})});const d=await r.json();if(!r.ok||!d.token)throw new Error(d.error||'تعذر بدء جلسة الزائر');state.token=d.token;state.guest=true;state.name=d.name||state.name||'زائر';localStorage.setItem('wine_name',state.name);localStorage.setItem('wine_token',state.token);localStorage.setItem('wine_guest','1');setIdentity();return true}
async function sendMessage(text){
 text=(text||'').trim();if(!text||state.busy)return;
 state.busy=true;$('#send').disabled=true;promptInput.value='';promptInput.style.height='auto';
 const thread=currentThread();if(thread.items.length===0)thread.title=text.slice(0,34);
 thread.items.push({role:'user',text});addMessage('user',text);
 const loading=addMessage('assistant','');const bubble=loading.querySelector('.bubble');
 bubble.innerHTML='<span class="typing">WINE AI بيجهّز الرد</span>';saveThreads();
 try{
  await ensureGuest();
  const history=thread.items.slice(-13,-1).map(m=>`${m.role==='user'?'المستخدم':'WINE AI'}: ${m.text}`).join('\n');
  const response=await fetch('/api/chat?stream=1',{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream','X-User-Token':`Bearer ${state.token}`},body:JSON.stringify({prompt:text,history,sessionId:thread.sessionId||state.sessionId})});
  if(!response.ok){let err={};try{err=await response.json()}catch{}throw new Error(err.error||'تعذر الاتصال بمحرك الذكاء الاصطناعي');}
  if(!response.body)throw new Error('المتصفح لا يدعم استقبال الرد المباشر');
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',answer='',streamError='';
  const handleEvent=raw=>{
   const lines=raw.split('\n');let event='message',data='';
   for(const line of lines){if(line.startsWith('event:'))event=line.slice(6).trim();else if(line.startsWith('data:'))data+=line.slice(5).trim();}
   if(!data)return;
   let payload={};try{payload=JSON.parse(data)}catch{return}
   if(event==='chunk'&&payload.text){answer+=payload.text;bubble.textContent=answer;messages.scrollTop=messages.scrollHeight;}
   if(event==='error')streamError=payload.error||'فشل توليد الرد';
   if(event==='done'&&payload.sessionId){state.sessionId=payload.sessionId;thread.sessionId=payload.sessionId;saveThreads();}
  };
  while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const events=buffer.split('\n\n');buffer=events.pop()||'';for(const ev of events)handleEvent(ev);}
  if(buffer.trim())handleEvent(buffer);
  if(streamError)throw new Error(streamError);
  if(!answer.trim())throw new Error('لم يصل رد من محرك الذكاء الاصطناعي');
  bubble.innerHTML=renderText(answer);thread.items.push({role:'assistant',text:answer});saveThreads();
 }catch(e){
  bubble.textContent=`تعذّر إكمال الطلب: ${e.message}`;thread.items.push({role:'assistant',text:`تعذّر إكمال الطلب: ${e.message}`});saveThreads();
 }finally{state.busy=false;$('#send').disabled=false;messages.scrollTop=messages.scrollHeight;promptInput.focus();}
}
function openName(){ $('#nameModal').classList.add('show'); $('#guestName').value=state.name||''; }
function closeName(){ $('#nameModal').classList.remove('show'); }
function saveName(e){e.preventDefault();const name=$('#guestName').value.trim().replace(/\s+/g,' ');if(name.length<2||name.length>30){$('#nameError').textContent='اكتب اسماً من حرفين إلى 30 حرفاً';return;}state.name=name;state.guest=true;state.token='';localStorage.setItem('wine_name',name);localStorage.removeItem('wine_token');localStorage.setItem('wine_guest','1');setIdentity();closeName();toast('أهلاً بك يا '+name);}
$('#send').addEventListener('click',()=>sendMessage(promptInput.value));promptInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(promptInput.value)}});promptInput.addEventListener('input',()=>{promptInput.style.height='auto';promptInput.style.height=Math.min(promptInput.scrollHeight,180)+'px'});
document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>sendMessage(b.dataset.prompt)));
$('#newChat').addEventListener('click',newThread);$('#newChatTop').addEventListener('click',newThread);$('#history').addEventListener('click',e=>{const t=e.target.closest('[data-id]');if(t)openThread(t.dataset.id)});
messages.addEventListener('click',async e=>{const replyBtn=e.target.closest('[data-copy-message]');if(replyBtn){const text=replyBtn.closest('.message')?.querySelector('.bubble')?.innerText||'';try{await navigator.clipboard.writeText(text);replyBtn.textContent='تم النسخ ✓';setTimeout(()=>replyBtn.textContent='نسخ الرد',1500)}catch{toast('تعذر النسخ تلقائياً')}return}const btn=e.target.closest('[data-copy]');if(!btn)return;const card=btn.closest('.code-card');const code=card?.querySelector('pre code')?.innerText||'';try{await navigator.clipboard.writeText(code);btn.textContent='تم النسخ ✓';setTimeout(()=>btn.textContent='نسخ الكود',1500)}catch{toast('تعذر النسخ تلقائياً؛ حدد الكود وانسخه')}});
$('#accountBtn').addEventListener('click',openName);$('#nameForm').addEventListener('submit',saveName);$('#nameModal').addEventListener('click',e=>{if(e.target.id==='nameModal')closeName()});

$('#mobileMenu').addEventListener('click',toggleSidebar);$('#sidebarClose').addEventListener('click',closeSidebar);$('#sidebarScrim').addEventListener('click',closeSidebar);document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSidebar();closeName()}});window.addEventListener('resize',()=>{if(window.innerWidth>850)closeSidebar()});
setIdentity();renderHistory();if(!state.name)openName();
