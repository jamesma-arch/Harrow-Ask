export const AREA_IDS = ['lower-school', 'upper-school', 'whole-school'];
export function validUrl(value, kind = 'source') {
  if (!value) return false;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
    if (kind === 'notebook') return u.hostname === 'notebooklm.google.com' && /^\/notebook\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname);
    if (kind === 'workflow') return u.hostname === 'gemini.google.com' && /^\/gems?\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname);
    return true;
  } catch { return false; }
}
export function isReady(d, mode = 'answer') {
  if (mode === 'task') return validUrl(d.workflowUrl, 'workflow') && d.workflowConfirmed === true && Boolean(d.owner.trim());
  return validUrl(d.notebookUrl, 'notebook') && d.confirmed === true && Boolean(d.owner.trim()) && d.sources.length > 0 && Boolean(d.reviewed);
}
export function validateConfig(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.departments) || input.departments.length === 0 || input.departments.length > 80) throw new Error('Invalid configuration: expected version 1 and 1–80 departments.');
  const seen = new Set();
  const str = (v, max = 300) => typeof v === 'string' ? v.trim().slice(0, max) : '';
  const departments = input.departments.map(d => {
    if (!d || !/^[a-z0-9-]{1,60}$/.test(d.id) || seen.has(d.id) || !AREA_IDS.includes(d.area)) throw new Error('Invalid or duplicate department ID / school area.');
    seen.add(d.id);
    const clean = { id: d.id, area: d.area, name: str(d.name, 100), nameTh: str(d.nameTh, 100), description: str(d.description), descriptionTh: str(d.descriptionTh), icon: str(d.icon, 20), owner: str(d.owner, 100), email: str(d.email, 150), notebookUrl: str(d.notebookUrl, 500), workflowUrl: str(d.workflowUrl, 500), confirmed: d.confirmed === true, workflowConfirmed: d.workflowConfirmed === true, reviewed: str(d.reviewed, 10), keywords: (Array.isArray(d.keywords) ? d.keywords : []).map(x => str(x, 60)).filter(Boolean).slice(0, 40), questions: (Array.isArray(d.questions) ? d.questions : []).slice(0, 4).map(q => ({ en: str(q.en), th: str(q.th) })), sources: (Array.isArray(d.sources) ? d.sources : []).slice(0, 50).map(s => ({ title: str(s.title, 150), url: str(s.url, 500) })) };
    if (!clean.name) throw new Error('Every department needs a name.');
    if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('Invalid department email.');
    if (clean.notebookUrl && !validUrl(clean.notebookUrl, 'notebook')) throw new Error('Use a shared notebook link from notebooklm.google.com/notebook/…');
    if (clean.workflowUrl && !validUrl(clean.workflowUrl, 'workflow')) throw new Error('Use a Gemini assistant link from gemini.google.com/gem/… or /gems/…');
    if (clean.reviewed && (!/^\d{4}-\d{2}-\d{2}$/.test(clean.reviewed) || Number.isNaN(Date.parse(clean.reviewed)) || new Date(clean.reviewed).toISOString().slice(0,10) !== clean.reviewed || clean.reviewed > new Date().toISOString().slice(0,10))) throw new Error('Use a valid review date that is not in the future.');
    if (clean.sources.some(s => !s.title || !validUrl(s.url))) throw new Error('Every source needs a title and a valid HTTPS link.');
    if (clean.confirmed && !(clean.owner && clean.notebookUrl && clean.sources.length && clean.reviewed)) throw new Error('Before confirming a notebook, add its owner, link, source documents and review date.');
    if (clean.workflowConfirmed && !(clean.owner && clean.workflowUrl)) throw new Error('Before confirming a task helper, add its owner and Gemini link.');
    return clean;
  });
  return { version: 1, departments };
}
export function rankedDepartments(departments, question) {
  const query = question.toLocaleLowerCase().trim();
  if (!query) return departments.map(d => ({ department: d, score: 0 }));
  const words = query.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2);
  return departments.map(d => {
    const title = (d.name + ' ' + d.nameTh).toLocaleLowerCase();
    let score = title.includes(query) ? 20 : 0;
    for (const key of d.keywords) {
      const keyword = key.toLocaleLowerCase();
      const matched = /^[a-z0-9]{1,3}$/.test(keyword) ? new RegExp(`(?:^|[^a-z0-9])${keyword}(?:$|[^a-z0-9])`).test(query) : query.includes(keyword);
      if (matched) score += key.length > 3 ? 8 : 5;
    }
    for (const word of words) if (title.includes(word)) score += 2;
    return { department: d, score };
  }).sort((a, b) => b.score - a.score);
}
export function buildPrompt(question, lang) {
  return lang === 'th'
    ? `${question.trim()}\n\nตอบเป็นภาษาไทยอย่างกระชับ โดยใช้เฉพาะข้อมูลจากเอกสารในสมุดบันทึกนี้ ระบุ: คำตอบ สิ่งที่ต้องทำต่อ และแหล่งอ้างอิง หากไม่พบข้อมูลให้แจ้งอย่างชัดเจน อย่าเดาขั้นตอนของโรงเรียน ถามเพิ่มเติมเฉพาะเมื่อจำเป็น`
    : `${question.trim()}\n\nAnswer briefly in English using only this notebook’s school documents. Give: Answer, Next step, and Source with citations. If the documents do not contain the answer, say so clearly; do not invent school procedures. Ask a follow-up only if needed.`;
}
