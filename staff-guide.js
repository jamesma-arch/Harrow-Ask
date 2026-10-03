/* Standalone staff onboarding for the supplied compiled app. No assistant data is changed. */
(() => {
  const copy = {
    en: {
      button: 'Tutorial', close: 'Close tutorial', back: 'Back', next: 'Next', done: 'Done', progress: 'Step',
      steps: [
        ['Quick answers, fewer emails', 'This hub helps you find the right school assistant. Choose your area or search for a topic, then open an assistant to ask your question.'],
        ['Find the right assistant', 'Use Search for a topic such as CCA or transport. Search finds assistants and departments; it does not answer your question itself.'],
        ['Choose your school area', 'On Home, choose Lower School, Upper School or Administration. Open the relevant department and look for an assistant with School Approved status.'],
        ['Open the assistant', 'Use the assistant’s launch link. It opens separately; use your school account if asked to sign in. Read its status and source details before relying on an answer.'],
        ['Ask one clear question', 'Include the year group or situation. For example: “What should Year 3 staff do if a CCA is cancelled? Give the next steps and the source.” You can also request an answer in Thai.'],
        ['Use the answer and its source', 'Look for a short answer, the next action and a linked source. If the information is missing or unclear, contact the named department owner. The assistant should say when it does not know.'],
        ['Save time next time', 'Use the star on an assistant to save it in My AI Tools. Reopen this book button whenever you need help. The English / Thai switch translates this tutorial.']
      ]
    },
    th: {
      button: 'วิธีใช้งาน', close: 'ปิดคำแนะนำ', back: 'ย้อนกลับ', next: 'ถัดไป', done: 'เสร็จสิ้น', progress: 'ขั้นตอน',
      steps: [
        ['หาคำตอบได้เร็ว ลดการส่งอีเมล', 'ศูนย์นี้ช่วยให้คุณค้นหาผู้ช่วยของโรงเรียนที่เหมาะสม เลือกฝ่ายหรือค้นหาหัวข้อ แล้วเปิดผู้ช่วยเพื่อถามคำถาม'],
        ['ค้นหาผู้ช่วยที่เหมาะสม', 'ใช้ช่องค้นหาเพื่อค้นหาหัวข้อ เช่น CCA หรือรถรับส่ง ช่องนี้ใช้ค้นหาผู้ช่วยและแผนก ยังไม่ได้ตอบคำถามของคุณโดยตรง'],
        ['เลือกส่วนงานของโรงเรียน', 'ที่หน้า Home เลือก Lower School, Upper School หรือ Administration จากนั้นเลือกแผนกที่เกี่ยวข้อง และมองหาผู้ช่วยที่มีสถานะ School Approved'],
        ['เปิดผู้ช่วย', 'กดลิงก์เปิดผู้ช่วย ระบบจะเปิดแยกต่างหาก หากต้องลงชื่อเข้าใช้ ให้ใช้บัญชีโรงเรียน ตรวจสอบสถานะและแหล่งข้อมูลก่อนนำคำตอบไปใช้'],
        ['ถามให้ชัดเจนทีละคำถาม', 'ระบุระดับชั้นหรือสถานการณ์ เช่น “ครู Year 3 ควรทำอย่างไรเมื่อกิจกรรม CCA ถูกยกเลิก? ช่วยบอกขั้นตอนและแหล่งข้อมูล” คุณสามารถขอให้ผู้ช่วยตอบเป็นภาษาไทยได้'],
        ['อ่านคำตอบพร้อมแหล่งอ้างอิง', 'คำตอบควรสั้น ระบุสิ่งที่ต้องทำต่อ และมีแหล่งอ้างอิง หากข้อมูลไม่ครบหรือไม่ชัดเจน ให้ติดต่อผู้รับผิดชอบแผนก ผู้ช่วยควรแจ้งเมื่อไม่มีข้อมูล'],
        ['ใช้งานได้เร็วขึ้นในครั้งต่อไป', 'กดดาวที่ผู้ช่วยเพื่อบันทึกใน My AI Tools กดปุ่มรูปหนังสือเพื่อดูคำแนะนำอีกครั้ง ปุ่ม English / ไทย ใช้เปลี่ยนภาษาของคำแนะนำนี้']
      ]
    }
  };
  let lang = 'en', step = 0, previousFocus, target;
  try { lang = localStorage.getItem('gems-guide-language') === 'th' ? 'th' : 'en'; } catch {}
  const launcher = document.createElement('button');
  launcher.id = 'staff-guide-launch';
  launcher.type = 'button';
  launcher.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z"/><path d="M12 5v15"/></svg><span></span>';
  document.body.append(launcher);
  const dialog = document.createElement('dialog');
  dialog.id = 'staff-guide';
  dialog.setAttribute('aria-labelledby', 'staff-guide-title');
  dialog.innerHTML = '<div class="guide-languages"><button type="button" data-lang="en">🇬🇧 English</button><button type="button" data-lang="th">🇹🇭 ไทย</button><button type="button" class="guide-close">×</button></div><p class="guide-progress" aria-live="polite"></p><h2 id="staff-guide-title"></h2><p class="guide-body"></p><div class="guide-actions"><button type="button" class="guide-back"></button><button type="button" class="guide-next"></button></div>';
  document.body.append(dialog);
  function findTarget() {
    if (step === 1) return [...document.querySelectorAll('header button')].find(el => /Search AI assistants/.test(el.textContent));
    if (step === 2) return [...document.querySelectorAll('main h2')].find(el => el.textContent === 'Choose your school area')?.closest('section');
    if (step === 3) return [...document.querySelectorAll('main a')].find(el => el.textContent.includes('Open CCA assistant'));
    if (step === 6) return [...document.querySelectorAll('main h2')].find(el => el.textContent.includes('My AI Tools'))?.closest('section');
    return null;
  }
  function position() {
    if (!dialog.open) return;
    document.querySelectorAll('.staff-guide-target').forEach(el => el.classList.remove('staff-guide-target'));
    target = findTarget();
    const margin = 14, width = Math.min(420, innerWidth - margin * 2);
    dialog.style.width = width + 'px';
    dialog.style.left = Math.max(margin, (innerWidth - width) / 2) + 'px';
    dialog.style.top = Math.max(margin, (innerHeight - dialog.offsetHeight) / 2) + 'px';
    if (!target || !target.getClientRects().length) return;
    const rect = target.getBoundingClientRect(), height = dialog.offsetHeight;
    // Only spotlight when there is room to explain without covering the target.
    let x, y;
    if (innerHeight - rect.bottom > height + margin * 2) { x = Math.max(margin, Math.min(rect.left, innerWidth - width - margin)); y = rect.bottom + margin; }
    else if (rect.top > height + margin * 2) { x = Math.max(margin, Math.min(rect.left, innerWidth - width - margin)); y = rect.top - height - margin; }
    else if (rect.left > width + margin * 2) { x = rect.left - width - margin; y = Math.max(margin, Math.min(rect.top, innerHeight - height - margin)); }
    else return;
    target.classList.add('staff-guide-target');
    dialog.style.left = x + 'px'; dialog.style.top = y + 'px';
  }
  function render() {
    const t = copy[lang];
    launcher.querySelector('span').textContent = t.button;
    launcher.setAttribute('aria-label', t.button + ' — English / ไทย');
    dialog.lang = lang;
    dialog.querySelector('.guide-close').setAttribute('aria-label', t.close);
    dialog.querySelector('.guide-progress').textContent = `${t.progress} ${step + 1} / ${t.steps.length}`;
    dialog.querySelector('h2').textContent = t.steps[step][0];
    dialog.querySelector('.guide-body').textContent = t.steps[step][1];
    dialog.querySelector('.guide-back').textContent = t.back;
    dialog.querySelector('.guide-back').disabled = step === 0;
    dialog.querySelector('.guide-next').textContent = step === t.steps.length - 1 ? t.done : t.next;
    dialog.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === lang)));
    requestAnimationFrame(position);
  }
  launcher.onclick = () => { previousFocus = document.activeElement; step = 0; dialog.showModal(); render(); };
  dialog.querySelector('.guide-close').onclick = () => dialog.close();
  dialog.querySelector('.guide-back').onclick = () => { if (step > 0) { step--; render(); } };
  dialog.querySelector('.guide-next').onclick = () => { if (step === copy[lang].steps.length - 1) dialog.close(); else { step++; render(); } };
  dialog.querySelectorAll('[data-lang]').forEach(el => el.onclick = () => { lang = el.dataset.lang; try { localStorage.setItem('gems-guide-language', lang); } catch {} render(); });
  dialog.addEventListener('close', () => { document.querySelectorAll('.staff-guide-target').forEach(el => el.classList.remove('staff-guide-target')); previousFocus?.focus(); });
  addEventListener('resize', position);
  addEventListener('scroll', position, { passive: true });
  render();
})();
