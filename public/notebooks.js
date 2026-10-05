import { initialDepartments } from './notebook-drafts.js';
export function setupNotebooks({api,getUser,getConfig,onChange}) {
  const $=id=>document.getElementById(id),form=$('notebook-form');
  let catalog={entries:initialDepartments(),revision:'',gatewayReady:false},editing='',loading=false,open=false,accessUser='',syncStates=new Map(),syncing=new Set();
  const errors={ADMIN_REQUIRED:'Only school administrators can manage department notebooks.',SIGN_IN_SETUP_REQUIRED:'School sign-in needs to be configured before departments can be saved.',SIGN_IN_REQUIRED:'Please sign in again with your school account.',INVALID_NOTEBOOK:'Check the department name, notebook title and ID.',INVALID_NOTEBOOK_URL:'Use a NotebookLM link from notebook.google.com, notebooklm.google.com or notebooklm.cloud.google.com.',NOTEBOOK_ID_MISMATCH:'The notebook ID does not match the link.',NOTEBOOK_APPROVAL_REQUIRED:'To include a notebook, add its ID or link and confirm its sources are approved for staff.',DUPLICATE_NOTEBOOK:'This notebook is already linked to another department entry.',CATALOG_CHANGED:'Another administrator has updated the registry. Refresh and review the entries before saving.',CATALOG_FULL:'The registry is full. Archive an unused entry first.',SERVICE_UNAVAILABLE:'The notebook registry could not be reached. Please try again.'};
  const mayManage=()=>Boolean(getUser()?.admin || getUser()?.manageSources);
  const maySync=e=>Boolean(getUser()?.admin || (getUser()?.email && e.ownerEmail===getUser().email));
  Object.assign(errors,{SOURCE_SETUP_REQUIRED:'Google Drive and the answer service need configuring before sync.',DEPARTMENT_ACCESS_REQUIRED:'You can only sync departments assigned to your account.',SOURCE_APPROVAL_REQUIRED:'An administrator must approve this source folder before sync.',INVALID_DRIVE_FOLDER:'Enter a Google Drive folder link or ID.',INVALID_OWNER:'Enter the department lead’s school email.',SOURCE_CHANGED:'Sources changed during sync. The previous successful set is retained; try again.',SOURCE_LIMIT:'The pilot accepts up to 40 files directly in the folder.',UNSUPPORTED_SOURCE:'The folder contains an unsupported file, subfolder or shortcut. Use supported documents only.',SOURCE_TOO_LARGE:'A source exceeds the pilot’s 8 MB limit.',EMPTY_SOURCE:'A source is empty.',SOURCE_IMPORT_FAILED:'A document could not be indexed. The last successful set is retained.',SOURCE_DOWNLOAD_DENIED:'Google Drive does not allow a source to be downloaded.',SOURCE_SERVICE_UNAVAILABLE:'Google Drive or the answer service could not complete sync.',SYNC_CHANGED:'Another sync changed this department. Refresh before continuing.',SYNC_EXPIRED:'This sync expired. Start again.'});
  function text(tag,value,className=''){const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;}
  function status(value,error=false){$('registry-status').textContent=value;$('registry-status').classList.toggle('error',error);}
  function clear(){editing='';form.reset();$('editor-title').textContent='Add a department';}
  function sync(){const user=getUser(),allowed=Boolean(user?.admin);
    $('notebook-fields').disabled=!allowed || loading;$('add-notebook').disabled=!allowed || loading;$('refresh-notebooks').disabled=!mayManage() || loading;
    $('registry-access').hidden=mayManage();
    $('registry-access').textContent=!getConfig().authReady?'School sign-in is not configured yet. The department workspace is ready to use once administrator access is connected.':!user?'Sign in with your approved school administrator account to manage department notebooks.':'Your account has staff access. Department notebook management is for administrators.';
    if(accessUser!==(user?.email||'')){catalog={entries:user?[]:initialDepartments(),revision:'',gatewayReady:false};accessUser=user?.email||'';clear();syncStates.clear();render();if(open && mayManage())void load();}
  }
  function render(){const active=catalog.entries.filter(e=>!e.archived),included=active.filter(e=>e.enabled && e.approved && catalog.gatewayReady && (catalog.provider==='drive-file-search'?(e.driveFolderId && syncStates.get(e.id)?.sourceCount>0):e.notebookId));
    $('department-count').textContent=active.length;$('enabled-count').textContent=included.length;$('registry-connection').textContent=catalog.gatewayReady?'Configured':'Pending';
    const query=$('notebook-search').value.toLowerCase(),showArchived=$('show-archived').checked;
    const entries=catalog.entries.filter(e=>(showArchived || !e.archived) && (e.department+' '+e.title+' '+e.description).toLowerCase().includes(query));
    const list=$('notebook-list');list.replaceChildren();
    if(!entries.length){const empty=text('div','', 'registry-empty');empty.append(text('h2',catalog.entries.length?'No matching departments':'Your knowledge workspace starts here'),text('p',catalog.entries.length?'Try a different search or show archived entries.':'Add a department, then link its NotebookLM notebook when you create it.'));list.append(empty);}
    for(const entry of entries){const card=text('article','','notebook-card');const top=text('div','','notebook-card-top');top.append(text('h2',entry.department));
      const syncInfo=syncStates.get(entry.id);
      const state=entry.archived?'Archived':(!entry.notebookId && !entry.driveFolderId)?'Notebook needed':!entry.enabled?(entry.approved?'Paused':'Review pending'):!catalog.gatewayReady?'Connection pending':entry.driveFolderId?(syncInfo?.lastSuccessfulSync?'Sources synced':'Sync needed'):'Notebook reference only';top.append(text('span',state,'notebook-state'));card.append(top,text('h3',entry.title),text('p',entry.description || 'Add a description of the questions this notebook covers.'));
      if(entry.ownerEmail)card.append(text('small','Department lead: '+entry.ownerEmail));
      if(entry.driveFolderId){card.append(text('p','Last successful sync: '+(syncInfo?.lastSuccessfulSync?new Date(syncInfo.lastSuccessfulSync).toLocaleString():'Never')+' · '+(syncInfo?.sourceCount||0)+' sources'));if(syncInfo?.status)card.append(text('p',syncInfo.status+(syncInfo.status==='Syncing'?' · '+syncInfo.completed+'/'+syncInfo.total:'')+(syncInfo.error?' · '+(errors[syncInfo.error]||'Sync failed; the previous source set is retained.'):'')));if(syncInfo?.files?.length){const details=text('details',''),summary=text('summary','Source versions');details.append(summary);const list=text('ul','');for(const f of syncInfo.files)list.append(text('li',f.name+' · updated '+f.modifiedTime+' · version '+(f.version||f.md5Checksum||'recorded')));details.append(list);card.append(details);}}
      if(entry.owner)card.append(text('small','Maintained by '+entry.owner));
      const controls=text('div','','notebook-card-actions');
      const edit=text('button',entry.archived?'Restore / edit':'Edit');edit.type='button';edit.disabled=!getUser()?.admin;edit.addEventListener('click',()=>{editing=entry.id;for(const key of ['department','title','description','owner','ownerEmail','driveFolderId','notebookUrl','notebookId'])form.elements[key].value=entry[key]||'';form.elements.approved.checked=entry.approved;form.elements.enabled.checked=entry.enabled;$('editor-title').textContent='Edit '+entry.department;form.elements.department.focus();});controls.append(edit);
      if(entry.id==='demo-ls-cca'){const sample=text('button','View demo notebook');sample.type='button';sample.addEventListener('click',()=>document.dispatchEvent(new Event('harrow-demo-notebook')));controls.append(sample);}
      if(entry.notebookUrl){const link=text('a','Open notebook ↗');link.href=entry.notebookUrl;link.target='_blank';link.rel='noopener noreferrer';controls.append(link);}
      if(entry.driveFolderId && !entry.archived){const sync=text('button',syncInfo?.status==='Syncing'?'Continue sync':'Sync department');sync.type='button';sync.disabled=!maySync(entry) || !entry.approved || !catalog.gatewayReady || syncing.has(entry.id);sync.addEventListener('click',()=>void runSync(entry));controls.append(sync);}
      if(!entry.archived){const archive=text('button','Archive');archive.type='button';archive.disabled=!getUser()?.admin;archive.addEventListener('click',()=>{if(confirm('Archive '+entry.department+'? It will stop supplying answers. You can restore it later.'))void save({action:'archive',id:entry.id});});controls.append(archive);}
      card.append(controls);list.append(card);
    }
  }
  async function runSync(entry){
    if(syncing.has(entry.id))return;syncing.add(entry.id);const email=getUser()?.email;render();
    try{let result=await api('sync',{action:'start',id:entry.id});if(getUser()?.email!==email)return;syncStates.set(entry.id,result);render();
      for(let i=0;result.status==='Syncing' && i<300;i++){
        if(getUser()?.email!==email)return;
        try{result=await api('sync',{action:'step',id:entry.id,jobId:result.jobId});}catch(error){if(error.message!=='SYNC_BUSY')throw error;}
        if(getUser()?.email!==email)return;
        syncStates.set(entry.id,result);render();
        if(result.status==='Syncing')await new Promise(resolve=>setTimeout(resolve,2000));
      }
      if(getUser()?.email!==email)return;
      status(result.status==='Synced'?'Sync complete. '+result.sourceCount+' documents are ready.':result.status==='Failed'?(errors[result.error]||'Sync failed. The previous successful source set is retained.'):'Sync paused. Use Continue sync to resume.',result.status==='Failed');await onChange();
    }catch(error){if(getUser()?.email===email)status(errors[error.message]||errors.SERVICE_UNAVAILABLE,true);}
    finally{syncing.delete(entry.id);render();}
  }
  async function load(){if(loading || !mayManage())return;loading=true;const email=getUser()?.email;sync();status('Loading department notebooks…');try{const loaded=await api('notebooks');if(getUser()?.email!==email)return;catalog=loaded;if(catalog.provider==='drive-file-search' && catalog.gatewayReady){await Promise.all(catalog.entries.filter(e=>e.driveFolderId && !e.archived && maySync(e)).map(async e=>{try{const result=await api('sync',{action:'status',id:e.id});if(getUser()?.email===email)syncStates.set(e.id,result);}catch{}}));}if(getUser()?.email!==email)return;render();status('');}catch(error){status(errors[error.message]||errors.SERVICE_UNAVAILABLE,true);}finally{loading=false;sync();}}
  async function save(body){if(loading || !getUser()?.admin)return;loading=true;const email=getUser()?.email;sync();status('Saving department notebooks…');try{const saved=await api('notebooks',{...body,revision:catalog.revision});if(getUser()?.email!==email)return;catalog=saved;render();clear();await onChange();status('Saved. '+(!catalog.gatewayReady?'The answer connection is still pending.':'The chat source list has been updated.'));}catch(error){status(errors[error.message]||errors.SERVICE_UNAVAILABLE,true);}finally{loading=false;sync();}}
  form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);void save({action:'save',...(editing?{id:editing}:{}),notebook:{ownerEmail:data.get('ownerEmail'),driveFolderId:data.get('driveFolderId'),department:data.get('department'),title:data.get('title'),description:data.get('description'),owner:data.get('owner'),notebookUrl:data.get('notebookUrl'),notebookId:data.get('notebookId'),approved:form.elements.approved.checked,enabled:form.elements.enabled.checked}});});
  $('add-notebook').addEventListener('click',()=>{clear();form.elements.department.focus();});$('cancel-notebook').addEventListener('click',clear);
  $('refresh-notebooks').addEventListener('click',()=>{clear();void load();});$('notebook-search').addEventListener('input',render);$('show-archived').addEventListener('change',render);
  function show(){open=true;$('staff-chat').hidden=true;$('notebook-panel').hidden=false;$('registry-signin').append($('google-signin'));location.hash='notebooks';sync();void load();}
  $('notebooks').addEventListener('click',show);
  $('back-chat').addEventListener('click',()=>{open=false;$('notebook-panel').hidden=true;$('staff-chat').hidden=false;$('connection-note').after($('google-signin'));history.replaceState(null,'',location.pathname+location.search);});
  render();if(location.hash==='#notebooks')show();return {sync};
}
