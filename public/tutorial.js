// Replayable, read-only tours: never submit a question or sync school documents.
export function setupTutorial({getLanguage}) {
  const $=id=>document.getElementById(id),dialog=$('tour'),card=$('tour-card'),spot=$('tour-spotlight');
  let index=0,steps=[],previousFocus;
  const th=()=>getLanguage()==='th';
  const step=(target,enTitle,enBody,thTitle,thBody)=>({target,title:th()?thTitle:enTitle,body:th()?thBody:enBody});
  function build(){
    if(!$('notebook-panel').hidden)return [
      step('.registry-summary','Your department sources','Check how many departments are included in chat. Only approved, enabled and successfully synced sources can supply answers.','เอกสารของแผนก','ตรวจสอบจำนวนแผนกที่ใช้ตอบคำถาม เอกสารต้องได้รับอนุมัติ เปิดใช้งาน และซิงค์สำเร็จแล้ว'),
      step('#notebook-search','Find your department','Search for your department. Administrators manage the catalogue; department leads can sync their own approved sources.','ค้นหาแผนก','ค้นหาแผนกของคุณ ผู้ดูแลระบบจัดการรายการ หัวหน้าแผนกซิงค์เอกสารของตนเองได้'),
      step('#notebook-list .notebook-card h3','Update and sync','Update the approved originals in your Drive folder, then choose Sync department on your card. Continue sync resumes an unfinished job. Wait for Sync complete and check the last successful sync and source versions. If sync fails, the previous successful sources remain active.','อัปเดตและซิงค์','อัปเดตเอกสารในโฟลเดอร์ Drive แล้วเลือก Sync department หรือ Continue sync รอให้เสร็จและตรวจสอบเวลาซิงค์และเวอร์ชัน หากล้มเหลว ระบบยังใช้เอกสารจากการซิงค์ครั้งล่าสุดที่สำเร็จ'),
      step('.registry-footnote','NotebookLM is refreshed separately','Harrow Ask reads the original Drive documents. Refresh your NotebookLM sources separately. The pilot reads files directly in the folder; whole spreadsheet workbooks are imported. Include only documents suitable for all authorised staff.','อัปเดต NotebookLM แยกต่างหาก','Harrow Ask อ่านเอกสารต้นฉบับใน Drive ต้องอัปเดต NotebookLM แยกต่างหาก ระบบนำเข้าทุกชีตในไฟล์ตาราง ใส่เฉพาะเอกสารที่บุคลากรที่ได้รับอนุญาตทุกคนอ่านได้')
    ];
    return [
      step('#connection-note','School access','Sign in with your approved school account when sign-in is available. A setup message means the live answer service is still waiting for configuration or a successful source sync.','การเข้าถึงของโรงเรียน','เข้าสู่ระบบด้วยบัญชีโรงเรียนที่ได้รับอนุญาตเมื่อพร้อม ข้อความตั้งค่าหมายถึงบริการยังต้องตั้งค่าหรือซิงค์เอกสาร'),
      step('#question','Ask your question','Use your own words and include the year group, season or date where relevant. Ask follow-up questions in the same conversation. Leave out personal pupil or staff information.','ถามคำถาม','ถามด้วยคำพูดของคุณเอง ระบุชั้นปี ฤดูกาล หรือวันที่เมื่อจำเป็น ถามต่อในบทสนทนาเดิมได้ ไม่ใส่ข้อมูลส่วนบุคคล'),
      step('#conversation .message','Check the evidence','Live answers include source links and sync dates when evidence is available. Open the original document to check the detail. If the documents do not support an answer, Harrow Ask should say so. Draft or proposed guidance is not approved policy.','ตรวจสอบหลักฐาน','คำตอบจากระบบจริงมีลิงก์เอกสารและวันที่ซิงค์เมื่อมีหลักฐาน เปิดเอกสารเพื่อตรวจสอบ หากข้อมูลไม่เพียงพอ ระบบควรแจ้งให้ทราบ ร่างหรือข้อเสนอยังไม่ใช่นโยบายที่อนุมัติ'),
      step('#demo-chat','Practise with the demo','Try demo uses scripted LS CCA examples. It does not connect to school documents or demonstrate a live sync. Exit demo before asking a real school question.','ลองใช้ตัวอย่าง','Try demo ใช้คำตอบตัวอย่าง LS CCA ไม่ได้เชื่อมต่อเอกสารจริงหรือซิงค์จริง ออกจากโหมดตัวอย่างก่อนถามคำถามจริง'),
      step('#language','English or Thai','Switch the interface language here. The tutorial follows your selected language. You can ask questions in English or Thai.','ภาษาอังกฤษหรือไทย','เปลี่ยนภาษาของหน้าจอได้ที่นี่ คู่มือใช้ภาษาที่เลือก ถามได้ทั้งภาษาอังกฤษและไทย'),
      step('#notebooks','Department leads','Open Department notebooks, then choose Tutorial again for the source-management walkthrough. Leads update their Drive documents and sync their own approved department. Administrators assign ownership and approve access.','หัวหน้าแผนก','เปิด Department notebooks แล้วเลือกคู่มืออีกครั้งเพื่อดูการจัดการเอกสาร หัวหน้าแผนกอัปเดตและซิงค์เอกสารของตน ผู้ดูแลระบบกำหนดผู้รับผิดชอบและอนุมัติ')
    ];
  }
  function target(){const el=document.querySelector(steps[index].target);return el && !el.closest('[hidden]')?el:null;}
  function position(){
    if(!dialog.open)return;
    const el=target(),gap=16,pad=12,w=innerWidth,h=innerHeight;
    card.style.width=Math.min(340,w-pad*2)+'px';
    const ch=Math.min(card.offsetHeight,h-pad*2),cw=card.offsetWidth;
    const r=el?.getBoundingClientRect();
    let x=(w-cw)/2,y=h-ch-pad;
    if(r){
      if(w-r.right>=cw+gap+pad){x=r.right+gap;y=Math.max(pad,Math.min(r.top,h-ch-pad));}
      else if(r.left>=cw+gap+pad){x=r.left-cw-gap;y=Math.max(pad,Math.min(r.top,h-ch-pad));}
      else if(h-r.bottom>=ch+gap+pad){y=r.bottom+gap;}
      else if(r.top>=ch+gap+pad){y=r.top-ch-gap;}
      // If the screen is too short, reserve a separate upper spotlight area.
      const top=Math.max(pad,r.top-6),bottom=Math.min(h-pad,r.bottom+6,y===h-ch-pad?y-gap:h-pad);
      spot.hidden=bottom<=top;
      Object.assign(spot.style,{left:Math.max(4,r.left-6)+'px',top:top+'px',width:Math.min(w-8,r.width+12)+'px',height:Math.max(0,bottom-top)+'px'});
    }else spot.hidden=true;
    card.style.left=Math.max(pad,Math.min(x,w-cw-pad))+'px';card.style.top=Math.max(pad,y)+'px';
  }
  function render(){
    const s=steps[index];$('guide-heading').textContent=s.title;$('guide-body').textContent=s.body;
    $('tour-progress').textContent=(th()?'ขั้นตอน ':'Step ')+(index+1)+' / '+steps.length;
    $('tour-back').textContent=th()?'ย้อนกลับ':'Back';$('tour-back').disabled=index===0;
    $('finish-tour').textContent=index===steps.length-1?(th()?'เสร็จสิ้น':'Finish'):(th()?'ถัดไป':'Next');
    $('close-tour').setAttribute('aria-label',th()?'ปิดคู่มือ':'Close tutorial');
    target()?.scrollIntoView?.({block:'center',behavior:'instant'});position();
  }
  function close(){dialog.close();}
  $('guide').addEventListener('click',()=>{previousFocus=document.activeElement;index=0;steps=build();dialog.showModal();render();$('finish-tour').focus();});
  $('close-tour').addEventListener('click',close);
  $('tour-back').addEventListener('click',()=>{if(index>0){index--;render();}});
  $('finish-tour').addEventListener('click',()=>{if(index===steps.length-1)close();else{index++;render();}});
  dialog.addEventListener('close',()=>{spot.hidden=true;previousFocus?.focus();});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('finish-tour').click();}if(e.key==='ArrowLeft'){e.preventDefault();$('tour-back').click();}});
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
}
