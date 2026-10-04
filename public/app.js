const $=id=>document.getElementById(id);
let language='en';try{language=localStorage.getItem('harrow-ask-language')==='th'?'th':'en';}catch{}
let token='',user=null,config={},history=[],busy=false,requestId=0;
const copy={
en:{heading:'Hello. How can I help?',subtitle:'Ask your school question in your own words.',greeting:'Hello, I’m Harrow Ask, your staff assistant. What can I help you with today?',hint:'English or Thai. Just ask naturally.',placeholder:'What would you like to know?',ask:'Ask Harrow ↑',guide:'How to use',signout:'Sign out',newchat:'New conversation',source:'KNOWLEDGE FROM NOTEBOOKLM',privacy:'Please leave out personal pupil or staff information.',setup:'The school’s NotebookLM connection is not ready yet. I can welcome you, but I can’t answer school questions until it is connected.',signin:'Sign in with your school account to ask a question.',thinking:'Checking NotebookLM sources…',refs:'NotebookLM sources',signed:'Signed in as ',copy:'Copy answer',copied:'Copied',guideheading:'Ask. Read. Carry on.',steps:[['Sign in','Use your approved school account.'],['Ask naturally','Include the year group or date if it matters. Ask follow-up questions in this same conversation.'],['Check the sources','Answers must come from the school’s NotebookLM notebook. If sources don’t support an answer, I’ll say so.']],gotit:'Got it',footer:'Answers with sources. Always.',examples:['How do I report an absence?','How do I book a room?','Where can I get IT help?'],errors:{SETUP_REQUIRED:'The NotebookLM connection is not ready yet.',SIGN_IN_REQUIRED:'Please sign in again with your school account.',STAFF_ACCESS_REQUIRED:'This account is not on the approved staff list. Please contact the school administrator.',BUSY:'NotebookLM is busy. Please try again shortly.',INVALID_REQUEST:'Please shorten your question and try again.',SERVICE_UNAVAILABLE:'I couldn’t reach the NotebookLM connection. Please try again.',FORBIDDEN:'This request could not be accepted.'}},
th:{heading:'สวัสดี มีอะไรให้ช่วยไหม?',subtitle:'ถามเรื่องโรงเรียนด้วยคำพูดของคุณเอง',greeting:'สวัสดี ฉันคือ Harrow Ask ผู้ช่วยสำหรับบุคลากร วันนี้มีอะไรให้ช่วยไหม?',hint:'ถามได้ทั้งภาษาไทยและอังกฤษ',placeholder:'ต้องการทราบเรื่องอะไร?',ask:'ถาม Harrow Ask ↑',guide:'วิธีใช้งาน',signout:'ออกจากระบบ',newchat:'เริ่มการสนทนาใหม่',source:'ข้อมูลจาก NOTEBOOKLM',privacy:'โปรดไม่ใส่ข้อมูลส่วนบุคคลของนักเรียนหรือบุคลากร',setup:'ยังไม่ได้เชื่อมต่อ NotebookLM ของโรงเรียน ฉันจึงยังไม่สามารถตอบคำถามเกี่ยวกับโรงเรียนได้',signin:'เข้าสู่ระบบด้วยบัญชีโรงเรียนเพื่อถามคำถาม',thinking:'กำลังตรวจสอบแหล่งข้อมูลใน NotebookLM…',refs:'แหล่งข้อมูล NotebookLM',signed:'เข้าสู่ระบบแล้ว: ',copy:'คัดลอกคำตอบ',copied:'คัดลอกแล้ว',guideheading:'ถาม อ่าน แล้วทำงานต่อ',steps:[['เข้าสู่ระบบ','ใช้บัญชีโรงเรียนที่ได้รับอนุญาต'],['ถามตามธรรมชาติ','ระบุชั้นปีหรือวันที่หากจำเป็น และถามต่อในบทสนทนาเดิมได้'],['ตรวจสอบแหล่งข้อมูล','คำตอบต้องมาจาก NotebookLM ของโรงเรียน หากข้อมูลไม่เพียงพอ ฉันจะแจ้งให้ทราบ']],gotit:'เข้าใจแล้ว',footer:'คำตอบพร้อมแหล่งข้อมูล',examples:['แจ้งการลางานอย่างไร?','จองห้องอย่างไร?','ขอความช่วยเหลือด้าน IT ได้ที่ไหน?'],errors:{SETUP_REQUIRED:'ยังไม่ได้เชื่อมต่อ NotebookLM',SIGN_IN_REQUIRED:'กรุณาเข้าสู่ระบบด้วยบัญชีโรงเรียนอีกครั้ง',STAFF_ACCESS_REQUIRED:'บัญชีนี้ยังไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ',BUSY:'ระบบไม่ว่าง กรุณาลองอีกครั้ง',INVALID_REQUEST:'กรุณาลดความยาวคำถาม',SERVICE_UNAVAILABLE:'ไม่สามารถเชื่อมต่อ NotebookLM กรุณาลองอีกครั้ง',FORBIDDEN:'ไม่สามารถรับคำขอนี้ได้'}}};
function t(){return copy[language];}
async function api(route,body){
const res=await fetch('/.netlify/functions/ask?route='+route,{method:body?'POST':'GET',headers:{...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
let data;try{data=await res.json();}catch{throw new Error('SERVICE_UNAVAILABLE');}if(!res.ok)throw new Error(data.error||'SERVICE_UNAVAILABLE');return data;
}
function message(role,text,citations=[]){
const item=document.createElement('article');item.className='message '+role;
const name=document.createElement('strong');name.textContent=role==='user'?(user?.name|| (language==='th'?'คุณ':'You')):'Harrow Ask';item.append(name);
const p=document.createElement('p');p.textContent=text;item.append(p);
if(citations.length){const refs=document.createElement('div');refs.className='references';const label=document.createElement('strong');label.textContent=t().refs;refs.append(label);const list=document.createElement('ul');for(const c of citations){const li=document.createElement('li');li.textContent=c.title;list.append(li);}refs.append(list);item.append(refs);}
if(role==='model' && citations.length){const b=document.createElement('button');b.textContent=t().copy;b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);b.textContent=t().copied;}catch{b.textContent=language==='th'?'เลือกข้อความเพื่อคัดลอก':'Select the text to copy';}});item.append(b);}
$('conversation').append(item);return item;
}
function reset(){requestId++;history=[];$('conversation').replaceChildren();message('model',t().greeting);$('status').textContent='';$('question').value='';busy=false;render();}
function render(){
for(const [id,key] of Object.entries({heading:'heading',subtitle:'subtitle',hint:'hint',send:'ask',guide:'guide',signout:'signout','new-chat':'newchat','source-label':'source',privacy:'privacy','guide-heading':'guideheading','finish-tour':'gotit','footer-note':'footer'}))$(id).textContent=t()[key];
document.documentElement.lang=language;$('question').placeholder=t().placeholder;$('language').textContent=language==='en'?'ไทย':'English';$('signout').hidden=!user;
$('send').disabled=busy || !config.ready || !user;
$('connection-note').hidden=Boolean(config.ready && user);$('connection-note').textContent=!config.ready?t().setup:t().signin;
$('guide-steps').replaceChildren();for(const [title,body]of t().steps){const li=document.createElement('li'),s=document.createElement('strong'),p=document.createElement('p');s.textContent=title;p.textContent=body;li.append(s,p);$('guide-steps').append(li);}
$('suggestions').replaceChildren();for(const example of t().examples){const button=document.createElement('button');button.type='button';button.textContent=example;button.addEventListener('click',()=>{$('question').value=example;$('question').focus();});$('suggestions').append(button);}
}
$('question-form').addEventListener('submit',async e=>{
e.preventDefault();if(busy)return;
if(!config.ready || !user){$('status').textContent=!config.ready?t().setup:t().signin;return;}
const text=$('question').value.trim();if(!text)return;const id=++requestId;busy=true;render();message('user',text);$('question').value='';$('status').textContent=t().thinking;
try{const data=await api('chat',{message:text,language,history});if(id!==requestId)return;message('model',data.text,data.citations||[]);if(data.supported)history=[...history,{role:'user',text},{role:'model',text:data.text.slice(0,3000)}].slice(-6);$('status').textContent='';}
catch(error){if(id!==requestId)return;const code=error.message;message('model',t().errors[code]||t().errors.SERVICE_UNAVAILABLE);if(code==='SIGN_IN_REQUIRED'){token='';user=null;}}
finally{if(id===requestId){busy=false;render();}}
});
$('question').addEventListener('keydown',e=>{if(e.key==='Enter' && !e.shiftKey && !e.isComposing){e.preventDefault();$('question-form').requestSubmit();}});
$('new-chat').addEventListener('click',reset);
$('language').addEventListener('click',()=>{language=language==='en'?'th':'en';try{localStorage.setItem('harrow-ask-language',language);}catch{}if(!history.length && !busy){$('conversation').replaceChildren();message('model',t().greeting);}render();});
$('signout').addEventListener('click',()=>{token='';user=null;reset();});
$('guide').addEventListener('click',()=>$('tour').showModal());
$('close-tour').addEventListener('click',()=>$('tour').close());
$('finish-tour').addEventListener('click',()=>$('tour').close());
reset();
try{
config=await api('config');render();
if(config.ready && config.clientId){const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=()=>{google.accounts.id.initialize({client_id:config.clientId,callback:async response=>{token=response.credential;try{user=await api('session');reset();$('status').textContent=t().signed+user.name;}catch(error){token='';user=null;$('status').textContent=t().errors[error.message]||t().errors.SERVICE_UNAVAILABLE;render();}}});google.accounts.id.renderButton($('google-signin'),{theme:'outline',size:'large'});};script.onerror=()=>{$('status').textContent=t().errors.SERVICE_UNAVAILABLE;};document.head.append(script);}
}catch{$('status').textContent=t().errors.SERVICE_UNAVAILABLE;render();}
