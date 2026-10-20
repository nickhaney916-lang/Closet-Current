'use strict';
(function(){
 const E=window.ClosetBackupEngine,BASE='https://hlkgymugtfbirlpunsra.supabase.co',KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO',BUCKET='closet-private';
 let db=null,user=null,enabled=false,activeSync=null,timer=null,retryDelay=2000,callbacks={},generation=0;
 // A single page can outlive an auth refresh, logout, BFCache restore or
 // another account's login. Bind every async sync pass to its owner/database
 // and generation so late responses can never touch the next user's closet.
 const current=op=>!!op&&enabled&&generation===op.generation&&
  user===op.user&&db===op.db&&window.closetAuth?.user?.id===op.user;
 const guard=op=>{if(!current(op))throw Error('Cloud account session changed');};
 const ownerSession=()=>({user,db,generation});
 const empty=()=>({schemaVersion:1,items:[],state:{}}),markerDefault=()=>({id:'cloud-sync',baseVersion:0,baseDocument:null,localRevision:0,dirty:false});
 function status(text){if(['Cloud backup up to date','Your closet will back up automatically'].includes(text)){const button=document.getElementById('resolveCloudConflict');if(button)button.hidden=true;}const p=document.getElementById('cloudStatus');if(p){p.hidden=false;p.textContent=text;}const banner=document.getElementById('cloudBanner');if(banner){banner.textContent=text;banner.hidden=['Cloud backup up to date','Your closet will back up automatically'].includes(text);}}
 function transact(stores,mode,fn,database=db){return new Promise((resolve,reject)=>{const tx=database.transaction(stores,mode);let value;try{value=fn(tx);}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve(typeof value==='function'?value():value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction stopped'));});}
 async function marker(){let value;await transact(['state'],'readonly',tx=>{const r=tx.objectStore('state').get('cloud-sync');r.onsuccess=()=>value=r.result;});return value||markerDefault();}
 async function markDirty(op=ownerSession()){guard(op);await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{if(!current(op))return;const m=r.result||markerDefault();store.put({...m,dirty:true,localRevision:m.localRevision+1});};},op.db);guard(op);}
 async function snapshot(){let items,state;await transact(['items','state'],'readonly',tx=>{const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();a.onsuccess=()=>items=a.result;b.onsuccess=()=>state=b.result;});return {local:{schemaVersion:1,items,state:Object.fromEntries(state.filter(x=>E.stateIds.includes(x.id)).map(x=>[x.id,x]))},m:state.find(x=>x.id==='cloud-sync')||markerDefault()};}
 async function api(path,{body,method='GET',contentType='application/json'}={},again=false,op=ownerSession()){
  guard(op);
  const token=await window.closetAuth.getAccessToken({force:again});
  // A token promise can resolve after a user signs out or another logs in.
  guard(op);
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(BASE+path,{method,signal:controller.signal,headers:{apikey:KEY,Authorization:'Bearer '+token,...(body===undefined?{}:{'Content-Type':contentType})},body:body===undefined?undefined:contentType==='application/json'?JSON.stringify(body):body,cache:'no-store'});
   guard(op);
   if(response.status===401&&!again)return await api(path,{body,method,contentType},true,op);
   if(!response.ok){const error=Error('Cloud request failed');error.status=response.status;throw error;}return response;
  }finally{clearTimeout(timeout);}
 }
 const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 function imageBytes(image){if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('Unsupported cloud photo');const bytes=Uint8Array.from(atob(image.split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>8388608||bytes[0]!==255||bytes[1]!==216)throw Error('Invalid cloud photo');return bytes;}
 function photoPath(value,owner=user){const path=value.slice('closet-photo:'.length);if(!value.startsWith('closet-photo:')||!new RegExp('^'+owner+'/[a-f0-9]{64}\\.jpg$').test(path))throw Error('Invalid private photo path');return path;}
 async function encode(value,op){guard(op);const photos=new Map(),document=await E.mapImages(value,async image=>{guard(op);const bytes=imageBytes(image),digest=await hash(bytes);guard(op);const path=op.user+'/'+digest+'.jpg';photos.set(path,bytes);return 'closet-photo:'+path;});guard(op);return {document:E.validateDocument(document),photos};}
 async function decode(document,op){guard(op);E.validateDocument(document);const photos=new Map();const result=await E.mapImages(document,async value=>{guard(op);const path=photoPath(value,op.user);if(!photos.has(path))photos.set(path,(async()=>{const response=await api('/storage/v1/object/'+BUCKET+'/'+path,{},false,op),bytes=new Uint8Array(await response.arrayBuffer());guard(op);if(bytes.length>8388608||await hash(bytes)!==path.split('/')[1].slice(0,-4))throw Error('Photo integrity check failed');guard(op);let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));return 'data:image/jpeg;base64,'+btoa(binary);})());return photos.get(path);});guard(op);return result;}
 async function upload(photos,op){for(const [path,bytes]of photos){guard(op);try{await api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',contentType:'image/jpeg',body:bytes},false,op);}catch(e){guard(op);if(e.status!==400&&e.status!==409)throw e;
   // An existing immutable object is safe only after verifying its contents.
   const existing=await api('/storage/v1/object/'+BUCKET+'/'+path,{},false,op),stored=new Uint8Array(await existing.arrayBuffer());guard(op);if(await hash(stored)!==path.split('/')[1].slice(0,-4))throw Error('Stored photo differs');
  }}}
 async function getRemote(op){guard(op);const response=await api('/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+op.user,{},false,op);const rows=await response.json();guard(op);if(!Array.isArray(rows)||rows.length>1)throw Error('Invalid cloud response');if(!rows.length)return null;const r=rows[0];if(!Number.isSafeInteger(r.revision)||r.revision<1)throw Error('Invalid cloud revision');E.validateDocument(r.document);return r;}
 async function apply(document,revision,expectedRevision,op,cb){
  guard(op);if(cb.canRestore&&!cb.canRestore())return false;
  const local=await decode(document,op);guard(op);let applied=false;
  await cb.capture(()=>{guard(op);return transact(['items','state'],'readwrite',tx=>{const state=tx.objectStore('state'),r=state.get('cloud-sync');r.onsuccess=()=>{
   // Recheck inside IndexedDB's delayed callback, not only before opening it.
   if(!current(op))return;
   const m=r.result||markerDefault();if(m.localRevision!==expectedRevision)return;
   const store=tx.objectStore('items');store.clear();for(const item of local.items)store.put(item);
   for(const id of E.stateIds)state.delete(id);
   for(const row of Object.values(local.state))state.put(row);
   state.put({...m,dirty:false,resolutionIds:[],needsRestore:false,baseVersion:revision,baseDocument:document});applied=true;
  };},op.db);});
  guard(op);if(applied)await cb.restored?.();return applied;
 }
 function schedule(delay=1500,op=ownerSession()){if(!current(op))return;clearTimeout(timer);timer=setTimeout(()=>{if(current(op))sync();},delay);}
 async function sync({keepBoth=false}={}){
  const op=ownerSession();if(!current(op)||activeSync&&activeSync.generation===op.generation)return;
  const run={generation:op.generation};activeSync=run;const cb=callbacks;let dirtyAtStart=false;
  try{
   let {local,m}=await cb.capture(snapshot);guard(op);dirtyAtStart=m.dirty;status('Checking cloud backup…');const remote=await getRemote(op);guard(op);
   if(!m.baseVersion&&!m.dirty&&(local.items.length||Object.values(local.state).some(x=>x.batch?.length||x.looks?.length||x.saved?.length||Object.keys(x.current?.slots||{}).length))){await markDirty(op);({local,m}=await cb.capture(snapshot));guard(op);dirtyAtStart=true;}
   if(!m.dirty){
    if(remote&&(remote.revision!==m.baseVersion||m.needsRestore)){status('Restoring your cloud closet…');if(!await apply(remote.document,remote.revision,m.localRevision,op,cb)){schedule();return;}}
    status(remote?'Cloud backup up to date':'Your closet will back up automatically');retryDelay=2000;return;
   }
   status('Backing up your closet…');const encoded=await encode(local,op);guard(op);let document=encoded.document;
   if(remote&&(remote.revision!==m.baseVersion||m.needsRestore)){
    if(keepBoth){
     const ids=new Map(m.resolutionIds||[]);document=E.keepBothDocuments(m.baseDocument,document,remote.document,row=>{const key=E.canonical(row);if(!ids.has(key))ids.set(key,crypto.randomUUID());return ids.get(key);});
     // Persist copy identities before the request so retries cannot create duplicate copies.
     await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{if(current(op))store.put({...r.result,resolutionIds:[...ids]});};},op.db);guard(op);
    }else document=E.mergeDocuments(m.baseDocument,document,remote.document);
   }
   await upload(encoded.photos,op);guard(op);
   const response=await api('/rest/v1/rpc/save_closet_backup',{method:'POST',body:{p_expected_revision:remote?.revision||0,p_document:document}},false,op),revision=await response.json();guard(op);
   if(revision===null){schedule(1500,op);return;}if(!Number.isSafeInteger(revision)||revision<1)throw Error('Invalid cloud save');
   // If another local save happened during upload, keep its durable pending flag.
   await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{if(!current(op))return;const record=r.result||markerDefault();store.put({...record,baseVersion:revision,baseDocument:E.equal(document,encoded.document)?document:encoded.document,needsRestore:!E.equal(document,encoded.document),dirty:record.localRevision!==m.localRevision});};},op.db);guard(op);
   const record=await marker();guard(op);if(record.dirty){status('Saved on this device · cloud backup pending');schedule(1500,op);}
   else if(!E.equal(document,encoded.document)){if(!await apply(document,revision,record.localRevision,op,cb))schedule(1500,op);else status('Cloud backup up to date');}
   else status('Cloud backup up to date');retryDelay=2000;
  }catch(e){
   if(current(op)){const resolveButton=document.getElementById('resolveCloudConflict');if(resolveButton)resolveButton.hidden=e.code!=='conflict';status(e.code==='conflict'?'Changes differ on another device. Both copies are kept; choose Keep both versions in My account.':dirtyAtStart?'Saved on this device · cloud backup pending. Retrying when connected.':'Cloud connection unavailable. Local items are kept; retrying.');if(e.code!=='conflict'){schedule(retryDelay,op);retryDelay=Math.min(retryDelay*2,60000);}}
  }finally{if(activeSync===run)activeSync=null;}
 }
 window.closetCloud={
  async start(database,settings){generation++;clearTimeout(timer);activeSync=null;enabled=false;db=database;callbacks=settings||{};user=window.closetAuth?.user?.id;enabled=!!db&&typeof window.closetAuth?.getAccessToken==='function'&&/^[a-f0-9-]{36}$/i.test(user||'');if(!enabled)return;
   navigator.storage?.persist?.().catch(()=>{});const button=document.getElementById('syncCloset');if(button){button.hidden=false;button.onclick=()=>sync();}const resolveButton=document.getElementById('resolveCloudConflict');if(resolveButton)resolveButton.onclick=()=>sync({keepBoth:true});await sync();
  },
  async beforeWrite(database){const op=ownerSession();if(current(op)&&database===op.db)await markDirty(op);},
  changed(){const op=ownerSession();if(current(op)){status('Saved on this device · cloud backup pending');schedule(1500,op);}},sync
 };
 window.addEventListener('pageshow',event=>{if(event.persisted&&db&&window.closetAuth?.user?.id===user){generation++;activeSync=null;enabled=true;sync();}});
 window.addEventListener('online',()=>sync());window.addEventListener('focus',()=>sync());setInterval(()=>sync(),60000);
 window.addEventListener('pagehide',()=>{generation++;clearTimeout(timer);activeSync=null;enabled=false;});
})();
