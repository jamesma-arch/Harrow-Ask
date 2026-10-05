import { initialDepartments } from '../public/notebook-drafts.js';
import { randomUUID } from 'node:crypto';
import { HttpError } from './auth.mjs';
export function validateNotebook(input) {
  if(!input || typeof input!=='object') throw new HttpError(400,'INVALID_NOTEBOOK');
  const clean=(key,max,required=false)=>{const value=input[key]??'';if(typeof value!=='string' || value.length>max || (required && !value.trim()))throw new HttpError(400,'INVALID_NOTEBOOK');return value.trim();};
  const department=clean('department',80,true),title=clean('title',120,true),description=clean('description',500),owner=clean('owner',120);
  let notebookId=clean('notebookId',200),notebookUrl=clean('notebookUrl',1000);
  if(notebookUrl){let url;try{url=new URL(notebookUrl);}catch{throw new HttpError(400,'INVALID_NOTEBOOK_URL');}
    if(url.protocol!=='https:' || !['notebook.google.com','notebooklm.google.com','notebooklm.cloud.google.com'].includes(url.hostname) || url.port || url.username || url.password || url.hash || [...url.searchParams.keys()].some(k=>k!=='authuser')) throw new HttpError(400,'INVALID_NOTEBOOK_URL');
    const fromUrl=url.pathname.match(/\/notebook\/([a-zA-Z0-9_-]+)\/?$/)?.[1];
    if(fromUrl && notebookId && fromUrl!==notebookId)throw new HttpError(400,'NOTEBOOK_ID_MISMATCH');
    notebookId=notebookId || fromUrl || '';
    notebookUrl=url.origin+url.pathname;
  }
  if(notebookId && !/^[a-zA-Z0-9_-]{1,200}$/.test(notebookId))throw new HttpError(400,'INVALID_NOTEBOOK');
  let driveFolderId=clean('driveFolderId',300),ownerEmail=clean('ownerEmail',200).toLowerCase();
  if(driveFolderId.startsWith('https://')){let url;try{url=new URL(driveFolderId);}catch{throw new HttpError(400,'INVALID_DRIVE_FOLDER');}if(url.hostname!=='drive.google.com' || url.port || url.username || url.password || url.search || url.hash)throw new HttpError(400,'INVALID_DRIVE_FOLDER');driveFolderId=url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)\/?$/)?.[1]||'';if(!driveFolderId)throw new HttpError(400,'INVALID_DRIVE_FOLDER');}
  if(driveFolderId && !/^[\w-]{1,200}$/.test(driveFolderId))throw new HttpError(400,'INVALID_DRIVE_FOLDER');
  if(ownerEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail))throw new HttpError(400,'INVALID_OWNER');
  const enabled=input.enabled===true,approved=input.approved===true;
  if(enabled && ((!notebookId && !driveFolderId) || !approved))throw new HttpError(400,'NOTEBOOK_APPROVAL_REQUIRED');
  return {department,title,description,owner,ownerEmail,driveFolderId,notebookId,notebookUrl,enabled,approved,archived:false};
}
export function createNotebookRepository(storeFactory,env=process.env) {
  async function store(){if(storeFactory)return storeFactory();const {getStore}=await import('@netlify/blobs');
    // Previews cannot read or mutate the production notebook registry.
    const scope=env.CONTEXT==='production'?'production':('preview-'+(env.DEPLOY_ID||'local'));
    return getStore({name:'harrow-ask-notebooks-'+scope,consistency:'strong'});
  }
  return {
    async read(){const s=await store();const entry=await s.getWithMetadata('catalog',{type:'json'});return {entries:entry?.data?.entries ?? initialDepartments(),revision:entry?.etag || '',updatedAt:entry?.data?.updatedAt || null};},
    async write(input,revision,user){const s=await store();const current=await s.getWithMetadata('catalog',{type:'json'});
      if(typeof revision!=='string' || revision!==(current?.etag || ''))throw new HttpError(409,'CATALOG_CHANGED');
      const entries=current?.data?.entries ?? initialDepartments();let next;
      if(input.action==='archive'){if(typeof input.id!=='string' || !entries.some(e=>e.id===input.id))throw new HttpError(404,'NOTEBOOK_NOT_FOUND');next=entries.map(e=>e.id===input.id?{...e,enabled:false,archived:true,updatedAt:new Date().toISOString(),updatedBy:user.email}:e);}
      else {
        const value=validateNotebook(input.notebook);
        if(input.id && (typeof input.id!=='string' || !entries.some(e=>e.id===input.id)))throw new HttpError(404,'NOTEBOOK_NOT_FOUND');
        if(!input.id && entries.filter(e=>!e.archived).length>=60)throw new HttpError(400,'CATALOG_FULL');
        if(value.notebookId && entries.some(e=>!e.archived && e.id!==input.id && e.notebookId===value.notebookId))throw new HttpError(400,'DUPLICATE_NOTEBOOK');
        const row={...value,id:input.id||randomUUID(),updatedAt:new Date().toISOString(),updatedBy:user.email};
        next=input.id?entries.map(e=>e.id===input.id?row:e):[...entries,row];
      }
      const updatedAt=new Date().toISOString();const saved=await s.setJSON('catalog',{entries:next,updatedAt},{...(current?{onlyIfMatch:current.etag}:{onlyIfNew:true})});
      if(!saved.modified)throw new HttpError(409,'CATALOG_CHANGED');
      return {entries:next,revision:saved.etag,updatedAt};
    }
  };
}
export function chatNotebooks(catalog,env={}) {
  const active=catalog.entries.filter(e=>!e.archived && e.enabled && e.approved && e.notebookId);
  // Retain the single-notebook setup only before the registry has been used.
  if(!catalog.entries.length && env.NOTEBOOKLM_NOTEBOOK_ID)return [{id:'legacy',department:'School knowledge',title:'School notebook',notebookId:env.NOTEBOOKLM_NOTEBOOK_ID}];
  return active.map(({id,department,title,notebookId})=>({id,department,title,notebookId}));
}
