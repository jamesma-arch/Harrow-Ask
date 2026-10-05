import { randomUUID } from 'node:crypto';
import { HttpError } from './auth.mjs';
import { sourceVersion } from './drive-search.mjs';
export function ownsDepartment(user,entry){return Boolean(user?.admin || (user?.email && entry.ownerEmail && user.email.toLowerCase()===entry.ownerEmail.toLowerCase()));}
export function createSourceSync(providers,storeFactory,env=process.env){
  async function store(){if(storeFactory)return storeFactory();const {getStore}=await import('@netlify/blobs');const scope=env.CONTEXT==='production'?'production':'preview-'+(env.DEPLOY_ID||'local');return getStore({name:'harrow-ask-sources-'+scope,consistency:'strong'});}
  const key=id=>'department/'+id;
  async function read(id){return (await store()).getWithMetadata(key(id),{type:'json'});}
  async function save(id,data,old){const result=await(await store()).setJSON(key(id),data,old?{onlyIfMatch:old.etag}:{onlyIfNew:true});if(!result.modified)throw new HttpError(409,'SYNC_CHANGED');return data;}
  function allowed(user,entry){if(!entry || entry.archived || !ownsDepartment(user,entry))throw new HttpError(403,'DEPARTMENT_ACCESS_REQUIRED');if(!entry.driveFolderId || !entry.approved)throw new HttpError(400,'SOURCE_APPROVAL_REQUIRED');}
  function view(data={}){const job=data.job;return {lastSuccessfulSync:data.active?.syncedAt||null,sourceCount:data.active?.files.length||0,files:data.active?.files||[],status:job?.status||'Never synced',error:job?.error||'',jobId:job?.id||'',completed:job?.completed||0,total:job?.files?.length||0,startedAt:job?.startedAt||null};}
  return {
    async status(user,entry){if(!ownsDepartment(user,entry))throw new HttpError(403,'DEPARTMENT_ACCESS_REQUIRED');const data=(await read(entry.id))?.data||{};return view({active:data.active?.folder===entry.driveFolderId?data.active:null,job:data.job?.folder===entry.driveFolderId?data.job:null});},
    async start(user,entry){allowed(user,entry);const old=await read(entry.id),data=old?.data||{};
      if(data.job?.status==='Syncing' && Date.parse(data.job.expiresAt)>Date.now())return view(data);
      const job={id:randomUUID(),status:'Syncing',folder:entry.driveFolderId,startedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+30*60*1000).toISOString(),completed:0,files:null,store:'',operation:null,leaseUntil:0};
      await save(entry.id,{...data,job},old);return view({...data,job});
    },
    async step(user,entry,jobId){allowed(user,entry);const old=await read(entry.id),data=old?.data;
      if(!data?.job || data.job.id!==jobId)throw new HttpError(409,'SYNC_CHANGED');
      if(data.job.status!=='Syncing')return view(data);
      if(data.job.folder!==entry.driveFolderId)throw new HttpError(409,'SYNC_CHANGED');
      if(data.job.leaseUntil>Date.now())throw new HttpError(409,'SYNC_BUSY');
      const job={...data.job,leaseUntil:Date.now()+90*1000};await save(entry.id,{...data,job},old);const locked=await read(entry.id);
      try{
        if(Date.parse(job.expiresAt)<Date.now())throw new HttpError(409,'SYNC_EXPIRED');
        if(!job.files){job.files=await providers.list(job.folder);if(job.files.length)job.store=await providers.create(entry.department);}
        else if(job.operation){const operation=await providers.operation(job.operation);if(operation.error)throw new HttpError(502,'SOURCE_IMPORT_FAILED');if(operation.done){job.completed++;job.operation=null;}}
        else if(job.completed<job.files.length){const operation=await providers.upload(job.store,job.files[job.completed]);if(operation.error)throw new HttpError(502,'SOURCE_IMPORT_FAILED');if(operation.done)job.completed++;else job.operation=operation.name;}
        else {const latest=await providers.list(job.folder);if(sourceVersion(latest)!==sourceVersion(job.files))throw new HttpError(409,'SOURCE_CHANGED');
          data.active={store:job.store,files:job.files.map(({id,name,mimeType,modifiedTime,version,md5Checksum})=>({id,name,mimeType,modifiedTime,version,md5Checksum})),syncedAt:new Date().toISOString(),folder:job.folder};job.status='Synced';}
      }catch(error){job.status='Failed';job.error=error instanceof HttpError?error.message:'SOURCE_SERVICE_UNAVAILABLE';}
      job.leaseUntil=0;await save(entry.id,{...data,job},locked);return view({...data,job});
    },
    async active(entries){const rows=[];for(const e of entries.filter(e=>e.enabled && e.approved && !e.archived && e.driveFolderId)){const active=(await read(e.id))?.data?.active;if(active?.store && active.folder===e.driveFolderId && active.files.length)rows.push({...active,id:e.id,department:e.department});}return rows;}
  };
}
