'use strict';
(function(){
 const E=window.ClosetBackupEngine,BASE='https://hlkgymugtfbirlpunsra.supabase.co',KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO',BUCKET='closet-private';
 let db=null,user=null,enabled=false,syncingGeneration=null,timer=null,retryDelay=2000,callbacks={},generation=0;
 // Auth owner, session epoch, database handle and local generation form a single restore/write gate.
 const scope=()=>({db,user,generation,epoch:window.closetAuth?.getSessionGeneration?.()??null});
 const current=gate=>enabled&&db===gate.db&&user===gate.user&&generation===gate.generation&&
  window.closetAuth?.user?.id===gate.user&&
  (window.closetAuth?.getSessionGeneration?.()??null)===gate.epoch;
 function requireScope(gate){if(!current(gate))throw Error('Account changed during cloud backup');}
 const empty=()=>({schemaVersion:1,items:[],state:{}}),markerDefault=()=>({id:'cloud-sync',baseVersion:0,baseDocument:null,localRevision:0,dirty:false});
 function status(text){if(['Cloud backup up to date','Your closet will back up automatically'].includes(text)){const button=document.getElementById('resolveCloudConflict');if(button)button.hidden=true;}const p=document.getElementById('cloudStatus');if(p){p.hidden=false;p.textContent=text;}const banner=document.getElementById('cloudBanner');if(banner){banner.textContent=text;banner.hidden=['Cloud backup up to date','Your closet will back up automatically'].includes(text);}}
 function transact(stores,mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction(stores,mode);let value;try{value=fn(tx);}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve(typeof value==='function'?value():value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction stopped'));});}
 async function marker(){let value;await transact(['state'],'readonly',tx=>{const r=tx.objectStore('state').get('cloud-sync');r.onsuccess=()=>value=r.result;});return value||markerDefault();}
 async function markDirty(){await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{const m=r.result||markerDefault();store.put({...m,dirty:true,localRevision:m.localRevision+1});};});}
 async function snapshot(){let items,state;await transact(['items','state'],'readonly',tx=>{const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();a.onsuccess=()=>items=a.result;b.onsuccess=()=>state=b.result;});return {local:{schemaVersion:1,items,state:Object.fromEntries(state.filter(x=>E.stateIds.includes(x.id)).map(x=>[x.id,x]))},m:state.find(x=>x.id==='cloud-sync')||markerDefault()};}
 async function api(path,{body,method='GET',contentType='application/json'}={},again=false){
  const gate=scope();requireScope(gate);
  const token=await window.closetAuth.getAccessToken({force:again});requireScope(gate);
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(BASE+path,{method,signal:controller.signal,headers:{apikey:KEY,Authorization:'Bearer '+token,...(body===undefined?{}:{'Content-Type':contentType})},body:body===undefined?undefined:contentType==='application/json'?JSON.stringify(body):body,cache:'no-store'});
   requireScope(gate);
   if(response.status===401&&!again)return await api(path,{body,method,contentType},true);
   if(!response.ok){const error=Error('Cloud request failed');error.status=response.status;throw error;}return response;
  }finally{clearTimeout(timeout);}
 }
 const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 function imageBytes(image){if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('Unsupported cloud photo');const bytes=Uint8Array.from(atob(image.split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>8388608||bytes[0]!==255||bytes[1]!==216)throw Error('Invalid cloud photo');return bytes;}
 function photoPath(value){const path=value.slice('closet-photo:'.length);if(!value.startsWith('closet-photo:')||!new RegExp('^'+user+'/[a-f0-9]{64}\\.jpg$').test(path))throw Error('Invalid private photo path');return path;}
 async function encode(value){const photos=new Map(),document=await E.mapImages(value,async image=>{const bytes=imageBytes(image),path=user+'/'+await hash(bytes)+'.jpg';photos.set(path,bytes);return 'closet-photo:'+path;});return {document:E.validateDocument(document),photos};}
 async function decode(document){E.validateDocument(document);const photos=new Map();return E.mapImages(document,async value=>{const path=photoPath(value);if(!photos.has(path))photos.set(path,(async()=>{const response=await api('/storage/v1/object/'+BUCKET+'/'+path),bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>8388608||await hash(bytes)!==path.split('/')[1].slice(0,-4))throw Error('Photo integrity check failed');let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));return 'data:image/jpeg;base64,'+btoa(binary);})());return photos.get(path);});}
 async function upload(photos){for(const [path,bytes]of photos){try{await api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',contentType:'image/jpeg',body:bytes});}catch(e){if(e.status!==400&&e.status!==409)throw e;
   // An existing immutable object is safe only after verifying its contents.
   const existing=await api('/storage/v1/object/'+BUCKET+'/'+path),stored=new Uint8Array(await existing.arrayBuffer());if(await hash(stored)!==path.split('/')[1].slice(0,-4))throw Error('Stored photo differs');
  }}}
 async function getRemote(){const response=await api('/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+user);const rows=await response.json();if(!Array.isArray(rows)||rows.length>1)throw Error('Invalid cloud response');if(!rows.length)return null;const r=rows[0];if(!Number.isSafeInteger(r.revision)||r.revision<1)throw Error('Invalid cloud revision');E.validateDocument(r.document);return r;}
 async function apply(document,revision,expectedRevision,gate){
  requireScope(gate);
  if(callbacks.canRestore&&!callbacks.canRestore())return false;
  const local=await decode(document);requireScope(gate);
  let applied=false;
  await callbacks.capture(()=>{
   requireScope(gate);
   return transact(['items','state'],'readwrite',tx=>{
    const state=tx.objectStore('state'),r=state.get('cloud-sync');
    r.onsuccess=()=>{
     if(!current(gate)){tx.abort();return;}
     const m=r.result||markerDefault();
     if(m.localRevision!==expectedRevision)return;
     const store=tx.objectStore('items');
     store.clear();
     for(const item of local.items)store.put(item);
     for(const id of E.stateIds)state.delete(id);
     for(const row of Object.values(local.state))state.put(row);
     state.put({...m,dirty:false,resolutionIds:[],needsRestore:false,baseVersion:revision,baseDocument:document});
     applied=true;
    };
   });
  });
  requireScope(gate);
  if(applied)await callbacks.restored?.();
  return applied;
 }

 function schedule(delay=1500){clearTimeout(timer);timer=setTimeout(()=>sync(),delay);}
 async function sync({keepBoth=false}={}){
  if(!enabled||syncingGeneration===generation)return;
  const gate=scope();if(!current(gate))return;
  const mine=generation;syncingGeneration=mine;let dirtyAtStart=false;
  try{
   let {local,m}=await callbacks.capture(snapshot);requireScope(gate);
   dirtyAtStart=m.dirty;status('Checking cloud backup…');const remote=await getRemote();
   requireScope(gate);
   if(!m.baseVersion&&!m.dirty&&(local.items.length||Object.values(local.state).some(x=>x.batch?.length||x.looks?.length||x.saved?.length||Object.keys(x.current?.slots||{}).length))){await markDirty();({local,m}=await callbacks.capture(snapshot));dirtyAtStart=true;}
   if(!m.dirty){
    if(remote&&(remote.revision!==m.baseVersion||m.needsRestore)){status('Restoring your cloud closet…');if(!await apply(remote.document,remote.revision,m.localRevision,gate)){schedule();return;}}
    status(remote?'Cloud backup up to date':'Your closet will back up automatically');retryDelay=2000;return;
   }
   status('Backing up your closet…');const encoded=await encode(local);requireScope(gate);let document=encoded.document;
   if(remote&&(remote.revision!==m.baseVersion||m.needsRestore)){
    if(keepBoth){
     const ids=new Map(m.resolutionIds||[]);document=E.keepBothDocuments(m.baseDocument,document,remote.document,row=>{const key=E.canonical(row);if(!ids.has(key))ids.set(key,crypto.randomUUID());return ids.get(key);});
     // Persist copy identities before the request so retries cannot create duplicate copies.
     await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>store.put({...r.result,resolutionIds:[...ids]});});
    }else document=E.mergeDocuments(m.baseDocument,document,remote.document);
   }
   await upload(encoded.photos);requireScope(gate);
   const response=await api('/rest/v1/rpc/save_closet_backup',{method:'POST',body:{p_expected_revision:remote?.revision||0,p_document:document}}),revision=await response.json();
   requireScope(gate);
   if(revision===null){schedule();return;}if(!Number.isSafeInteger(revision)||revision<1)throw Error('Invalid cloud save');
   // If another local save happened during upload, keep its durable pending flag.
   await transact(['state'],'readwrite',tx=>{requireScope(gate);const store=tx.objectStore('state'),r=store.get('cloud-sync');
    r.onsuccess=()=>{if(!current(gate)){tx.abort();return;}
     const marker=r.result||markerDefault();store.put({...marker,baseVersion:revision,baseDocument:E.equal(document,encoded.document)?document:encoded.document,needsRestore:!E.equal(document,encoded.document),dirty:marker.localRevision!==m.localRevision});};
   });requireScope(gate);
   const current=await marker();if(current.dirty){status('Saved on this device · cloud backup pending');schedule();}
   else if(!E.equal(document,encoded.document)){if(!await apply(document,revision,current.localRevision,gate))schedule();else status('Cloud backup up to date');}
   else status('Cloud backup up to date');retryDelay=2000;
  }catch(e){
   if(current(gate)){const resolveButton=document.getElementById('resolveCloudConflict');if(resolveButton)resolveButton.hidden=e.code!=='conflict';status(e.code==='conflict'?'Changes differ on another device. Both copies are kept; choose Keep both versions in My account.':dirtyAtStart?'Saved on this device · cloud backup pending. Retrying when connected.':'Cloud connection unavailable. Local items are kept; retrying.');if(e.code!=='conflict'){schedule(retryDelay);retryDelay=Math.min(retryDelay*2,60000);}}
  }finally{if(syncingGeneration===mine)syncingGeneration=null;}
 }
 window.closetCloud={
  // Read-only source for the authenticated avatar preflight. Do not expose a
  // cloud owner after pagehide, before start, or when the Auth user changes.
  getOwnerId(database){return enabled&&db===database&&window.closetAuth?.user?.id===user?user:null;},
  async start(database,settings){const nextUser=window.closetAuth?.user?.id;
   if(db!==database||user!==nextUser){generation++;clearTimeout(timer);syncingGeneration=null;}
   db=database;callbacks=settings||{};user=nextUser;enabled=!!db&&typeof window.closetAuth?.getAccessToken==='function'&&/^[a-f0-9-]{36}$/i.test(user||'');if(!enabled)return;
   navigator.storage?.persist?.().catch(()=>{});const button=document.getElementById('syncCloset');if(button){button.hidden=false;button.onclick=()=>sync();}const resolveButton=document.getElementById('resolveCloudConflict');if(resolveButton)resolveButton.onclick=()=>sync({keepBoth:true});await sync();
  },
  async beforeWrite(database){if(enabled&&database===db)await markDirty();},
  changed(){if(enabled){status('Saved on this device · cloud backup pending');schedule();}},
  invalidateSession(){generation++;enabled=false;clearTimeout(timer);},sync
 };
 window.addEventListener('pageshow',event=>{if(event.persisted&&db&&window.closetAuth?.user?.id===user){enabled=true;sync();}});
 window.addEventListener('online',()=>sync());window.addEventListener('focus',()=>sync());setInterval(()=>sync(),60000);
 window.addEventListener('pagehide',()=>{generation++;clearTimeout(timer);enabled=false;});
})();
