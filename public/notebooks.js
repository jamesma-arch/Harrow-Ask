export function setupNotebooks({api,getUser,getConfig,onChange}) {
  const $=id=>document.getElementById(id),form=$('notebook-form');
  let catalog={entries:[],revision:'',gatewayReady:false},editing='',loading=false,open=false,accessUser='';
  const errors={ADMIN_REQUIRED:'Only school administrators can manage department notebooks.',SIGN_IN_SETUP_REQUIRED:'School sign-in needs to be configured before departments can be saved.',SIGN_IN_REQUIRED:'Please sign in again with your school account.',INVALID_NOTEBOOK:'Check the department name, notebook title and ID.',INVALID_NOTEBOOK_URL:'Use a NotebookLM link from notebooklm.google.com or notebooklm.cloud.google.com.',NOTEBOOK_ID_MISMATCH:'The notebook ID does not match the link.',NOTEBOOK_APPROVAL_REQUIRED:'To include a notebook, add its ID or link and confirm its sources are approved for staff.',DUPLICATE_NOTEBOOK:'This notebook is already linked to another department entry.',CATALOG_CHANGED:'Another administrator has updated the registry. Refresh and review the entries before saving.',CATALOG_FULL:'The registry is full. Archive an unused entry first.',SERVICE_UNAVAILABLE:'The notebook registry could not be reached. Please try again.'};
  function text(tag,value,className=''){const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;}
  function status(value,error=false){$('registry-status').textContent=value;$('registry-status').classList.toggle('error',error);}
  function clear(){editing='';form.reset();$('editor-title').textContent='Add a department';}
  function sync(){const user=getUser(),allowed=Boolean(user?.admin);
    $('notebook-fields').disabled=!allowed || loading;$('add-notebook').disabled=!allowed || loading;$('refresh-notebooks').disabled=!allowed || loading;
    $('registry-access').hidden=allowed;
    $('registry-access').textContent=!getConfig().authReady?'School sign-in is not configured yet. The department workspace is ready to use once administrator access is connected.':!user?'Sign in with your approved school administrator account to manage department notebooks.':'Your account has staff access. Department notebook management is for administrators.';
    if(accessUser!==(user?.email||'')){catalog={entries:[],revision:'',gatewayReady:false};accessUser=user?.email||'';clear();render();if(open && allowed)void load();}
  }
  function render(){const active=catalog.entries.filter(e=>!e.archived),included=active.filter(e=>e.enabled && e.approved && e.notebookId);
    $('department-count').textContent=active.length;$('enabled-count').textContent=included.length;$('registry-connection').textContent=catalog.gatewayReady?'Configured':'Pending';
    const query=$('notebook-search').value.toLowerCase(),showArchived=$('show-archived').checked;
    const entries=catalog.entries.filter(e=>(showArchived || !e.archived) && (e.department+' '+e.title+' '+e.description).toLowerCase().includes(query));
    const list=$('notebook-list');list.replaceChildren();
    if(!entries.length){const empty=text('div','', 'registry-empty');empty.append(text('h2',catalog.entries.length?'No matching departments':'Your knowledge workspace starts here'),text('p',catalog.entries.length?'Try a different search or show archived entries.':'Add a department, then link its NotebookLM notebook when you create it.'));list.append(empty);}
    for(const entry of entries){const card=text('article','','notebook-card');const top=text('div','','notebook-card-top');top.append(text('h2',entry.department));
      const state=entry.archived?'Archived':!entry.notebookId?'Notebook needed':!entry.enabled?'Paused':!catalog.gatewayReady?'Connection pending':'Included in chat';top.append(text('span',state,'notebook-state'));card.append(top,text('h3',entry.title),text('p',entry.description || 'Add a description of the questions this notebook covers.'));
      if(entry.owner)card.append(text('small','Maintained by '+entry.owner));
      const controls=text('div','','notebook-card-actions');
      const edit=text('button',entry.archived?'Restore / edit':'Edit');edit.type='button';edit.disabled=!getUser()?.admin;edit.addEventListener('click',()=>{editing=entry.id;for(const key of ['department','title','description','owner','notebookUrl','notebookId'])form.elements[key].value=entry[key]||'';form.elements.approved.checked=entry.approved;form.elements.enabled.checked=entry.enabled;$('editor-title').textContent='Edit '+entry.department;form.elements.department.focus();});controls.append(edit);
      if(entry.notebookUrl){const link=text('a','Open notebook ↗');link.href=entry.notebookUrl;link.target='_blank';link.rel='noopener noreferrer';controls.append(link);}
      if(!entry.archived){const archive=text('button','Archive');archive.type='button';archive.disabled=!getUser()?.admin;archive.addEventListener('click',()=>{if(confirm('Archive '+entry.department+'? It will stop supplying answers. You can restore it later.'))void save({action:'archive',id:entry.id});});controls.append(archive);}
      card.append(controls);list.append(card);
    }
  }
  async function load(){if(loading || !getUser()?.admin)return;loading=true;sync();status('Loading department notebooks…');try{catalog=await api('notebooks');render();status('');}catch(error){status(errors[error.message]||errors.SERVICE_UNAVAILABLE,true);}finally{loading=false;sync();}}
  async function save(body){if(loading || !getUser()?.admin)return;loading=true;sync();status('Saving department notebooks…');try{catalog=await api('notebooks',{...body,revision:catalog.revision});render();clear();await onChange();status('Saved. '+(!catalog.gatewayReady?'The NotebookLM connection is still pending.':'The chat source list has been updated.'));}catch(error){status(errors[error.message]||errors.SERVICE_UNAVAILABLE,true);}finally{loading=false;sync();}}
  form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);void save({action:'save',...(editing?{id:editing}:{}),notebook:{department:data.get('department'),title:data.get('title'),description:data.get('description'),owner:data.get('owner'),notebookUrl:data.get('notebookUrl'),notebookId:data.get('notebookId'),approved:form.elements.approved.checked,enabled:form.elements.enabled.checked}});});
  $('add-notebook').addEventListener('click',()=>{clear();form.elements.department.focus();});$('cancel-notebook').addEventListener('click',clear);
  $('refresh-notebooks').addEventListener('click',()=>{clear();void load();});$('notebook-search').addEventListener('input',render);$('show-archived').addEventListener('change',render);
  function show(){open=true;$('staff-chat').hidden=true;$('notebook-panel').hidden=false;$('registry-signin').append($('google-signin'));location.hash='notebooks';sync();void load();}
  $('notebooks').addEventListener('click',show);
  $('back-chat').addEventListener('click',()=>{open=false;$('notebook-panel').hidden=true;$('staff-chat').hidden=false;$('connection-note').after($('google-signin'));history.replaceState(null,'',location.pathname+location.search);});
  render();if(location.hash==='#notebooks')show();return {sync};
}
