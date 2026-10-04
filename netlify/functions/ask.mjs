import { authenticate, HttpError } from '../../server/auth.mjs';
import { createNotebookRepository, chatNotebooks } from '../../server/notebooks.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
// School gateway contract; this is not an undocumented Google chat API.
export function notebookConfig(env) {
  let endpoint;
  try { endpoint=new URL(env.NOTEBOOKLM_CHAT_ENDPOINT); } catch { return null; }
  if(endpoint.protocol!=='https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || /(^localhost$|^127\.|^10\.|^192\.168\.|^169\.254\.|^\[|\.local$)/i.test(endpoint.hostname)) return null;
  if(!env.NOTEBOOKLM_GATEWAY_TOKEN || (env.NOTEBOOKLM_NOTEBOOK_ID && !/^[a-zA-Z0-9_-]{1,200}$/.test(env.NOTEBOOKLM_NOTEBOOK_ID))) return null;
  return {endpoint:endpoint.href,notebookId:env.NOTEBOOKLM_NOTEBOOK_ID};
}
export function supportedAnswer(data,notebooks) {
  const rows=typeof notebooks==='string'?[{notebookId:notebooks,department:'School knowledge'}]:notebooks;
  const allowed=new Map(rows.map(n=>[n.notebookId,n]));
  if(data?.provider!=='notebooklm' || (data.notebookId && !allowed.has(data.notebookId)) || data.supported!==true || typeof data.text!=='string' || !data.text.trim() || data.text.length>12000) return null;
  if(!Array.isArray(data.citations) || !data.citations.length || data.citations.length>50) return null;
  const citations=[];
  for(const c of data.citations){const notebookId=c?.notebookId || data.notebookId;
    if(!allowed.has(notebookId) || typeof c.title!=='string' || !c.title.trim() || typeof c.sourceId!=='string' || !c.sourceId.trim())return null;
    citations.push({title:c.title.slice(0,200),sourceId:c.sourceId.slice(0,200),notebookId,department:allowed.get(notebookId).department});
  }
  return {supported:true,text:data.text.trim(),citations:citations.slice(0,12)};
}
export function createHandler(env=process.env,fetcher=fetch,auth=authenticate,repository=createNotebookRepository(null,env)) {
  return async request=>{
    try {
      const url=new URL(request.url),route=url.searchParams.get('route');
      if(request.headers.get('origin') && request.headers.get('origin')!==url.origin) throw new HttpError(403,'FORBIDDEN');
      const notebook=notebookConfig(env);
      const authReady=Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_ALLOWED_DOMAIN && (env.STAFF_EMAILS || env.ADMIN_EMAILS));
      if(route==='config' && request.method==='GET') {
        let ready=false;
        if(authReady && notebook)ready=chatNotebooks(await repository.read(),env).length>0;
        return json({provider:'notebooklm',authReady,ready,clientId:authReady?env.GOOGLE_CLIENT_ID:'',domain:env.GOOGLE_ALLOWED_DOMAIN||''});
      }
      if(!authReady)throw new HttpError(503,'SIGN_IN_SETUP_REQUIRED');
      const user=await auth(request,env,fetcher);
      if(route==='session' && request.method==='GET')return json({name:user.name,email:user.email,admin:user.admin});
      if(route==='notebooks') {
        if(!user.admin)throw new HttpError(403,'ADMIN_REQUIRED');
        if(request.method==='GET')return json({...await repository.read(),gatewayReady:Boolean(notebook)});
        if(request.method==='POST'){
          const raw=await request.text();if(raw.length>12000)throw new HttpError(413,'INVALID_REQUEST');
          let body;try{body=JSON.parse(raw);}catch{throw new HttpError(400,'INVALID_REQUEST');}
          if(!body || !['save','archive'].includes(body.action))throw new HttpError(400,'INVALID_REQUEST');
          return json({...await repository.write(body,body.revision,user),gatewayReady:Boolean(notebook)});
        }
        throw new HttpError(405,'METHOD_NOT_ALLOWED');
      }
      if(route!=='chat' || request.method!=='POST') throw new HttpError(404,'NOT_FOUND');
      if(!notebook)throw new HttpError(503,'SETUP_REQUIRED');
      const notebooks=chatNotebooks(await repository.read(),env);
      if(!notebooks.length)throw new HttpError(503,'NO_NOTEBOOKS');
      const raw=await request.text();
      if(raw.length>16000) throw new HttpError(413,'INVALID_REQUEST');
      let body;try{body=JSON.parse(raw);}catch{throw new HttpError(400,'INVALID_REQUEST');}
      if(typeof body.message!=='string' || !body.message.trim() || body.message.length>2000) throw new HttpError(400,'INVALID_REQUEST');
      const history=Array.isArray(body.history)?body.history.slice(-6):[];
      if(history.some(x=>!['user','model'].includes(x.role) || typeof x.text!=='string' || x.text.length>3000)) throw new HttpError(400,'INVALID_REQUEST');
      const result=await fetcher(notebook.endpoint,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:'Bearer '+env.NOTEBOOKLM_GATEWAY_TOKEN},body:JSON.stringify({provider:'notebooklm',...(notebooks.length===1?{notebookId:notebooks[0].notebookId}:{}),notebooks: notebooks.map(n=>({notebookId:n.notebookId,department:n.department,title:n.title})),message:body.message.trim(),language:body.language==='th'?'th':'en',history,user:{email:user.email},sourcePolicy:'notebook-only'}),signal:AbortSignal.timeout(24000)});
      if(!result.ok) throw new HttpError(result.status===429?429:502,result.status===429?'BUSY':'SERVICE_UNAVAILABLE');
      const answer=supportedAnswer(await result.json(),notebooks);
      return json(answer || {supported:false,text:body.language==='th'?'ยังไม่พบคำตอบที่มีแหล่งข้อมูลใน NotebookLM รองรับ กรุณาเพิ่มรายละเอียดหรือติดต่อทีมที่เกี่ยวข้อง':'I couldn’t find an answer supported by the school’s NotebookLM sources. Please add more detail or check with the relevant school team.',citations:[]});
    } catch(error) {return json({error:error instanceof HttpError?error.message:'SERVICE_UNAVAILABLE'},error instanceof HttpError?error.status:502);}
  };
}
export default createHandler();
